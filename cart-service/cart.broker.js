import amqp from "amqplib";
import amqpConfig from "./amqp.config.js";
import cartModel from "./model/cart.schema.js";

class Broker {
    publisherChannel;
    consumerChannel;
    connection;
    exchangeName = amqpConfig.rabbitMQ.exchangeName;

    async setup() {
        if (this.connection) return;

        this.connection = await amqp.connect(amqpConfig.rabbitMQ.url);
        this.publisherChannel = await this.connection.createChannel();
        this.consumerChannel = await this.connection.createChannel();

        await this.publisherChannel.assertExchange(this.exchangeName, "direct");
        await this.consumerChannel.assertExchange(this.exchangeName, "direct");
        await this.consumerChannel.assertQueue("cart");
        await this.consumerChannel.bindQueue("cart", this.exchangeName, "to_cart");
    }

    async publishMessage(routingKey, message, type) {

        const buffer = Buffer.from(JSON.stringify({
            message,
            type,
            time: new Date(),
            from: "cart-service"
        }));
        await this.publisherChannel.publish(this.exchangeName, routingKey, buffer);
        console.log(`Message sent to exchange ${this.exchangeName} from cart`);
    }

    consumeMessage() {
        return new Promise((resolve, reject) => {
            this.consumerChannel.consume("cart", async (msg) => {
                if (!msg) {
                    console.log("Received null message");
                    return reject(new Error("Consumer cancelled by server"));
                }

                const content = JSON.parse(msg.content.toString());
                console.log("Received message from", content.from, "\n", content);

                try {
                    switch (content.type) {
                        case "stock_details":
                            console.log("Cart processing");
                            const cartUpdated = await cartModel.updateOne(
                                {},
                                {
                                    $push: {
                                        items: { bookId: content.message._id },
                                    },
                                },
                                { upsert: true, new: true }
                            );
                            console.log("Cart updated");
                            this.consumerChannel.ack(msg);
                            return resolve(cartUpdated);
                        case "out_of_stock":
                            this.consumerChannel.ack(msg);
                            return resolve({ message: "Item out of stock" });
                        default:
                            this.consumerChannel.nack(msg);
                            throw new Error("Unknown message type");
                    }
                } catch (error) {
                    this.consumerChannel.nack(msg);
                    console.error(error);
                    return reject(error);
                }
            }, { noAck: false });
        });
    }

}

export default Broker;

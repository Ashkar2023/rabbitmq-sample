import amqp from "amqplib";
import amqpConfig from "./amqp.config.js";
import productModel from "./model/product.Schema.js";

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
        await this.consumerChannel.assertQueue("product");
        await this.consumerChannel.bindQueue("product", this.exchangeName, "to_product");
    }

    async publishMessage(routingKey, message, type) {
        await this.setup();

        const buffer = Buffer.from(JSON.stringify({
            type,
            message,
            date: new Date(),
            from: "product-service"
        }));

        await this.publisherChannel.publish(this.exchangeName, routingKey, buffer);
        console.log(`Message sent to exchange ${this.exchangeName} from product`);
    }

    async consumeMessage() {
        await this.setup();

        return new Promise((resolve, reject) => {
            this.consumerChannel.consume("product", async (msg) => {
                if (msg) {
                    const messageContent = JSON.parse(msg.content.toString());
                    console.log("Received message from", messageContent.from, "\n", messageContent);

                    try {
                        switch (messageContent.type) {
                            case "check_stock":
                                console.log("Checking stock");
                                await this.checkStock(messageContent.message.bookId);
                                this.consumerChannel.ack(msg);
                                break;
                            default:
                                this.consumerChannel.nack(msg);
                                return reject(new Error("Unknown message type"));
                        }
                    } catch (error) {
                        this.consumerChannel.nack(msg);
                        return reject(error);
                    }
                }
            }, { noAck: false });
        });
    }

    async checkStock(bookId) {
        try{
            const bookDetails = await productModel.findOne({ bookId }).exec();
            
            if (bookDetails.stock <= 0) {
                await this.publishMessage("to_cart", bookDetails, "out_of_stock");
            } else {
                await this.publishMessage("to_cart", bookDetails, "stock_details");
            }
        }catch(error){
            console.log(error.message)
        }

    }
}

export default Broker;

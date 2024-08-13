import express from "express";
import { connect } from "mongoose";
import Broker from "./cart.broker.js";

const app = express();
const cartBroker = new Broker();
await cartBroker.setup();
cartBroker.consumeMessage();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
    console.log(req.url);
    next();
});

(async function () {
    try {
        await connect("mongodb://localhost:27017/BS-cart");
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
})();

app.listen(3001, () => {
    console.log("Cart service => %d", 3001);
});

// GET /item/:bookId - Add item to cart
app.post("/item/:bookId", async (req, res) => {
    try {
        const message = { bookId: req.params.bookId };
        await cartBroker.publishMessage("to_product", message, "check_stock");
        
        res.status(200).json({ data: "result", success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Couldn't process the current request!", success: false, error: error.message });
    }
});

// Additional routes can be implemented here as needed


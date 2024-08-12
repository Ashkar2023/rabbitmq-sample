import express from "express";
import { connect } from "mongoose";
import productModel from "./model/product.Schema.js";
import Broker from "./product.broker.js";

const app = express();
const productBroker = new Broker();

(async function () {
    try {
        await connect("mongodb://localhost:27017/BS-inventory");
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
})();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
    console.log(req.url);
    next();
});

app.listen(3002, () => {
    console.log("Product service => %d", 3002);
});

// POST /addbook - Add new product
app.post("/addbook", async (req, res) => {
    try {
        const { title, stock, price } = req.body;
        const newBook = new productModel({ title, price, stock });
        const added = await newBook.save();

        if (added) {
            res.status(201).json({ success: true, message: "Book added!", result: added });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "Failed to add book" });
    }
});

await productBroker.setup();
await productBroker.consumeMessage();
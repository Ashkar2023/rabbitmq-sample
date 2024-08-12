import { model, Schema, Types } from "mongoose";

const cartSchema = new Schema({
    items: [
        {
            bookId: {
                type: Types.ObjectId,
                required: true
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ]
})

const cartModel = model("cart", cartSchema,"cart");
export default cartModel;
import { model, Schema } from "mongoose";

const productSchema = new Schema({
    bookId:{
        type:Number,
        required:true,
    },
    title:{
        type:String,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    price:{
        type:Number,
        required:true,
        min:[0,"faulty price"]
    }
})

productSchema.pre("validate",async function(next){ /* Dont use anonymous fn */
    if(this.isNew){
        try{
            const latest = await this.constructor.findOne().sort({bookId:-1}).select("bookId").exec();
            this.bookId = latest ? latest.bookId + 1 : 1;
            next();
        }catch(error){
            console.log(error.message)
            return next(error);
        }
    }else next()
})


const productModel = model("Inventory",productSchema,"inventory");
export default productModel;
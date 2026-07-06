import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
{
    buyer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    items:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product"
            },

            quantity:{
                type:Number,
                default:1
            }
        }
    ],

    total:{
        type:Number,
        required:true
    },

    status:{
        type:String,
        enum:[
            "Pending",
            "Packed",
            "Shipped",
            "Out for Delivery",
            "Delivered"
        ],
        default:"Pending"
    }

},
{
    timestamps:true
}
);

export default mongoose.model("Order",orderSchema);
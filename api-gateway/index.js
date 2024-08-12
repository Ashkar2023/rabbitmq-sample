import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

//cart => 3001
//inventory => 3002
//order => 3003

const app = express();
/* shouldn't parse any incoming request */

const server = app.listen(3000,()=>{
    console.log("API gateway => %d\n\n\n",server.address().port);
});


app.use("/cart",createProxyMiddleware({
    target:"http://localhost:3001/",
    changeOrigin:true,
    on:{
        error:(error,req,res,target)=>{
            console.log(error);
            console.log(target)
        },
        proxyReq:()=>console.log("to cart"),
        proxyRes:()=>console.log("from cart")
    }
}))

app.use("/inventory",createProxyMiddleware({
    target:"http://localhost:3002/",
    changeOrigin:true,
    pathRewrite:{
        "^/inventory":""
    },
    on:{
        error:(error,req,res,target)=>{
            console.log(error);
            console.log(target);
        },
        proxyReq:()=>console.log("proxy")
    }
}))

app.use("/order",createProxyMiddleware({
    target:"http://localhost:3003/",
    changeOrigin:true,
    on:{
        error:(error,req,res,target)=>{
            console.log(error);
            console.log(target)
        }
    }
}))

app.get("/",(req,res)=>{
    res.send("from api gateway")
})

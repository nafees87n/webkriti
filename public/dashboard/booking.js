// alert("CONN");
var bottoml=document.querySelector(".bottom_left");
var bottomr=document.querySelector(".bottom_right");
var bottomm=document.querySelector(".bottom_mid");
var left=document.querySelector(".left");
var right=document.querySelector(".right");
// var top=document.querySelector(".top");
// top.addEventListener("click",function(){
//     document.querySelector("#athover").textContent="A";
// });
bottoml.addEventListener("click",function(){
    document.querySelector("#athover").textContent="E";
});
bottomr.addEventListener("click",function(){
    document.querySelector("#athover").textContent="C";
});
bottomm.addEventListener("click",function(){
    document.querySelector("#athover").textContent="D";
});
left.addEventListener("click",function(){
    document.querySelector("#athover").textContent="F";
});
right.addEventListener("click",function(){
    document.querySelector("#athover").textContent="B";
});
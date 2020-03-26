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
    // var k="E"
    document.querySelector("input").value="E";
});
bottomr.addEventListener("click",function(){
    document.querySelector("#athover").textContent="C";
    document.querySelector("#stand").value="C";
});
bottomm.addEventListener("click",function(){
    document.querySelector("#athover").textContent="D";
    document.querySelector("#stand").value="D";
});
left.addEventListener("click",function(){
    document.querySelector("#athover").textContent="F";
    document.querySelector("#stand").value="F";
});
right.addEventListener("click",function(){
    document.querySelector("#athover").textContent="B";
    document.querySelector("#stand").value="B";
});
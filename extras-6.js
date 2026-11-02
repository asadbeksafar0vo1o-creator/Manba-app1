/* Manba 6.0 — qo‘shimcha vidjetlar (faqat brauzer ichida, tashqi so‘rov yo‘q) */
(function(){
  "use strict";
  var MONTHS=["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
  var DAYS=["Du","Se","Ch","Pa","Ju","Sh","Ya"];
  function renderCalendar(){
    var box=document.getElementById("cal-panel"); if(!box) return;
    var now=new Date(), y=now.getFullYear(), m=now.getMonth();
    var first=new Date(y,m,1), offset=(first.getDay()+6)%7, days=new Date(y,m+1,0).getDate();
    box.textContent="";
    var head=document.createElement("div"); head.className="row-between";
    var h=document.createElement("h3"); h.textContent="Kalendar"; head.appendChild(h);
    var c=document.createElement("span"); c.className="counter"; c.textContent=MONTHS[m]+" "+y; head.appendChild(c);
    box.appendChild(head);
    var grid=document.createElement("div"); grid.className="cal-grid";
    DAYS.forEach(function(d){var e=document.createElement("span");e.className="cal-dow";e.textContent=d;grid.appendChild(e);});
    for(var i=0;i<offset;i++){var b=document.createElement("span");b.className="cal-empty";grid.appendChild(b);}
    for(var d=1;d<=days;d++){
      var cell=document.createElement("span"); cell.className="cal-day"; cell.textContent=String(d);
      if(d===now.getDate()) cell.classList.add("cal-today");
      grid.appendChild(cell);
    }
    box.appendChild(grid);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",renderCalendar); else renderCalendar();
})();

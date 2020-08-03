const getdate=(data)=>{
  const Object = new Date();
  var year = Object.getFullYear();// 年
  var month = Object.getMonth()+1;// 月
  var day = Object.getDate()// 日
  var hour = Object.getHours();// 小时
  var minute = Object.getMinutes();// 分钟
  var second = Object.getSeconds();// 秒
  if (hour < 10){
    hour = "0" + hour;
  }
  if (minute < 10){
    minute = "0" + minute;
  }
  if (second < 10){
    second = "0" + second;
  }
  var resultDate = year + "/" + month + "/" + day; //日期
  var resultTime = hour + ":" + minute + ":" + second

  // 转为对象形式
  resuletObject = {
    resultDate: resultDate,
    resultTime: resultTime
  }
  // 返回日期 时间
  return resuletObject;
}

module.exports = {
  getdate
}
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const testCarCoordinate = cloud.database().collection("TestCarCoordinate");// 选择 TestCarCoordinate 表
// 云函数入口函数
exports.main = async (event) => {
  const latitude = event.latitude,
        longitude = event.longitude,
        tb_id = event.tb_id,
        type = event.type;
  let getResult;
  if (type==3){ //查询
    getResult = await testCarCoordinate.get()
  }
  if (type == 0 && latitude != "" && longitude!=""){ // 添加
    getResult = await testCarCoordinate.add({ data: { latitude: latitude, longitude: longitude }})
  }
  if (type == 1 && latitude != "" && longitude != "") {// 更新
    getResult = await  testCarCoordinate.doc(tb_id).update({ data: { latitude: latitude, longitude: longitude }})
  } 
  return {
    event,
    getResult
  }
}
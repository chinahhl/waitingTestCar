// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const car_db = cloud.database().collection("Car");// 选择汽车存放表
// 云函数入口函数
exports.main = async (event) => {
  const type = event.type,
        tb_id = event.tb_id,
        carName = event.carName;
  if(type == 0){ // 添加
    await car_db.add({ data: { carName: carName, LineUpNumber: 0, TestCarUserInfo: {} } })
  }
  if(type == 1){ // 删除
    await car_db.doc(tb_id).remove();
  }
  return {
    event
  }
}
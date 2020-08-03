// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const CheckInallowed_db = cloud.database().collection("CheckInallowed"); // 是否可签到排队
const car_db = cloud.database().collection("Car");// 选择汽车存放表
const TrainingCar = cloud.database().collection("TrainingCar");// 正在练车表
const lineUp_db = cloud.database().collection("AllUserLineUp");// 用户排队表

// 云函数入口函数
exports.main = async (event) => {
  var type = event.type,
      SignIn_tb = event.SignIn_tb, // 签到表id
      CarInfo = "",
      TrainingCarInfo = "",
      lineUp_Info = "";
  if(type == 0){ // 打开
    await CheckInallowed_db.doc(SignIn_tb).update({ data:{SignIn: true}})
  }
  if(type == 1){ // 关闭
    await CheckInallowed_db.doc(SignIn_tb).update({ data:{SignIn: false}})
    var CarInfo = await car_db.get(); // 车辆
    var TrainingCarInfo = await TrainingCar.get(); // 正在练车
    var lineUp_Info = await lineUp_db.get(); // 排队表
    for(var i=0; i<CarInfo.data.length; i++){ // 清除车辆排队人数
      if(CarInfo.data[i].LineUpNumber > 0){ await car_db.doc(CarInfo.data[i]._id).update({ data:{LineUpNumber: 0} }) }
    }
    for(var i=0;i<TrainingCarInfo.data.length; i++){ // 清除正在练车数据
      await TrainingCar.doc(TrainingCarInfo.data[i]._id).remove();
    }
    for(var i=0;i<lineUp_Info.data.length; i++){ // 清除排队用户数据
      await lineUp_db.doc(lineUp_Info.data[i]._id).remove();
    }
  }
  return{
    CarInfo,
    TrainingCarInfo,
    lineUp_Info
  }
}
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const car_db = cloud.database().collection("Car");// 选择汽车存放表
const lineUp_db = cloud.database().collection("AllUserLineUp");// 选择用户排队存放表
const TrainingCar = cloud.database().collection("TrainingCar");// 正在练车表
const CoachReminder = cloud.database().collection("CoachReminder");// 提醒用户下车信息列
// 云函数入口函数
exports.main = async (event) => {
  let type = event.type; // 0=> 增加车 1=>删除车辆  2=>修改车辆排队人数 3=>添加排队个人信息 4=>删除当前排队用户 5=>用户正在练车状态 6=> 用户下车状态
  let TestS = "",// 上车成功返回的内容
      CarResult = "";// 返回成功增加了车辆的结果

  var AllLineUpInfo = "";
  if(type == 0){ // 增加车辆
    let carName = event.carName; // 车的名字
    await car_db.add({ data: { carName: carName, LineUpNumber: 0 } })
  }
  if(type == 1){ // 删除车辆
    let car_tb_id = event.car_tb_id;// 存放汽车表id
    await car_db.doc(car_tb_id).remove();
  }
  if (type == 2){ // 修改车辆排队人数 1.先查询车辆 2.再用返回的结果
    let car_tb_id = event.car_tb_id,// 存放汽车表id
    types = event.types; // 0增加 1减去
    let ResuletcarLineUpNumber = await car_db.doc(car_tb_id).get(); // 获取车辆等待人数
    if(types == 0){ // 0增加
      CarResult = await car_db.doc(car_tb_id).update({ data: { LineUpNumber: ResuletcarLineUpNumber.data.LineUpNumber + 1 } })
    }
    if(types == 1 && ResuletcarLineUpNumber.data.LineUpNumber > 0){ // 1减去
      CarResult = await car_db.doc(car_tb_id).update({ data: { LineUpNumber: ResuletcarLineUpNumber.data.LineUpNumber - 1 } })
    }
  }
  if (type == 3) {// 添加排队个人信息
    let userObj = event.userObj; // 所有用户
    await lineUp_db.add({ data: userObj })
  }
  if(type==4){ // 删除当前排队用户
    // let user_tb_id = event.user_tb_id;
    // await lineUp_db.doc(user_tb_id).remove();
    let user_openid = event.user_openid,
        user_tb_id = undefined, // 需要删除用户的表id
        ThisLineUpInfo = await lineUp_db.get(); // 获取所有用户
        for(var i=0; i< ThisLineUpInfo.data.length; i++){
          if(ThisLineUpInfo.data[i]._openid == user_openid){
            user_tb_id = ThisLineUpInfo.data[i]._id;
            break;
          }
        }
        await lineUp_db.doc(user_tb_id).remove(); // 删除找到的该用户
  }

  if(type==5){ // 上车
    let InTestCarInfo = event.InTestCarInfo,
        car_tb_id = InTestCarInfo.car_tb_id,
        OpenId =  InTestCarInfo.OpenId,
        User_tb_id = InTestCarInfo.User_tb_id,
        CarName = InTestCarInfo.CarName,
        UserIcon = InTestCarInfo.UserIcon,
        RealName = InTestCarInfo.RealName,
        Usergender = InTestCarInfo.Usergender;
        TestS = await TrainingCar.add({ data:{car_tb_id: car_tb_id, OpenId: OpenId, User_tb_id: User_tb_id, CarName: CarName, UserIcon: UserIcon, RealName: RealName, Usergender} });
        await lineUp_db.doc(User_tb_id).remove(); // 移除排队
  }
  if(type==6){ // 下车
    let InUserTestCar_Tb = event.InUserTestCar_Tb, // 正在练车人的表id
       car_tb_id = event.car_tb_id; // 等待车辆id
       await TrainingCar.doc(InUserTestCar_Tb).remove(); // 移除正在练车
       let ResuletcarLineUpNumber = await car_db.doc(car_tb_id).get(); // 获取车辆等待人数
       if(ResuletcarLineUpNumber.data.LineUpNumber != 0){ await car_db.doc(car_tb_id).update({ data: { LineUpNumber: ResuletcarLineUpNumber.data.LineUpNumber - 1 } }) } // 减去 等待人数
  }

  if(type == 7){ // 位置互换 返回1 没有人替换位置了 2只有两个人 3有三个人以上
    var OneUser = event.OneUser,// 第一个用户
        TwoUser = event.TwoUser;// 第二个用户的信息
        // AllLineUpInfo = await lineUp_db.orderBy('LineUpTime', 'asc').get();


    AllLineUpInfo = {
      ThisLineUpLongSTime: OneUser,
      TwoUserLineUpLongSTim: TwoUser
    }
    var longtimes = Date.now(TwoUser.LineUpTime) + 1;
    await lineUp_db.doc(OneUser._id).update({ data:{ LineUpTime: longtimes}});// 修改第二个的排队时间
  }
  if(type == 8){ // 添加需提醒学员openid 到
      var OpenId = event.OpenId,
          RealName = event.RealName;
          await CoachReminder.add({data: { OpenId: OpenId, RealName: RealName}}); // 添加需提醒学员
  }
  if(type == 9){ // 删除提醒
    var reminder_tb_id = event.reminder_tb_id;
        await CoachReminder.doc(reminder_tb_id).remove();
  }
  return {
    event,
    TestS,
    CarResult,
    AllLineUpInfo
  }
}

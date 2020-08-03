// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const AllUserInfo = cloud.database().collection("UserInfo");// 选择 UserInfo 表
// 云函数入口函数
exports.main = async (event) => {
  var type = event.type;
  if(type == 0){
    var allUserInfo = await AllUserInfo.get();
  }
  if(type == 1){
    var realName = event.realName,
        ThisUserId = event.ThisUserId;
    await AllUserInfo.doc(ThisUserId).update({ data: { realName: realName } });
  }

  return {
    allUserInfo,
    event
  }
}
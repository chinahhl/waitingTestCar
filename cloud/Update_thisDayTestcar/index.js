// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database().collection("UserInfo"); // 选择 UserInfo 表
// 云函数入口函数
exports.main = async (event) => { // 修改今天练车的客户 
  const type = event.type;

  if (type == 1 && event._thisDayTestcar != true) { // 修改练车用户今天已练车为 true
    await db.doc(event.user_tb_id).update({
      data: {
        _thisDayTestcar: true
      }
    });
    return;
  }

  var allUserInfo = await db.get();
  for (var i = 0; i < allUserInfo.data.length; i++) {
    if (allUserInfo.data[i]._thisDayTestcar != false) {
      let _thisUserTb_id = allUserInfo.data[i]._id;
      await db.doc(_thisUserTb_id).update({
        data: {
          _thisDayTestcar: false
        }
      })
    }
  }

  return {
    event,
    allUserInfo
  }
}
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database().collection("StudentApplication");// 选择 StudentApplication 表
const userinfo = cloud.database().collection("UserInfo");// 选择 UserInfo 表
// 云函数入口函数
// 1.同意=> 首先删除已在申请表中的用户，更改用户信息表里的type=0(学员)
// 2.删除=> 首先删除已在申请表中的用户,更改掉用户信息表里的真实名字未空
exports.main = async (event) => {
  let del_id = event.tb_id; // 获取需要删除的用户表id
  let btn = event.btn; // 按钮按的是哪个
  
  if(btn == "yes"){ // 同意
    await db.doc(del_id).remove(); //删除申请表里同意或者被拒绝用户
    await userinfo.doc(del_id).update({ data:{ type: 0 } }) // 把游客变成学员
  } 
  if (btn == "no"){ //拒绝
    await db.doc(del_id).remove(); //删除申请表里同意或者被拒绝用户
    await userinfo.doc(del_id).update({ data: { realName: '' } }) // 把名字变为空
  }
  return {
    event
  }
}
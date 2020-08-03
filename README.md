"# 学车排队小程序"

工程目录解析
   api（本地操作）
   ----ApplyToStudent.js----游客申请
   ----getUserInfo.js----获取用户信息处理
   ----getUserLocaltion.js----获取用户位置处理
   ----LineUpCar.js----用户排队处理
   ----openPhoneNumber----调起系统callphone
   ----StudentManagement----学员管理
   cloud（云端函数操作）
   -----AlluserInfo----获取云端数据库所有用户信息
   -----applyAstudent----同意申请处理
   -----CarManage----车辆管理
   -----delUser----删除用户
   -----delUserRequest----拒绝申请处理
   -----Open_and_CloseSignIn----清除排队、练车等信息
   -----setLocaltionInfo----设置GPS签到位置
   -----stratLineUp----开始排队处理
   -----Update_thisDayTestcar----更新状态
   -----updateTestSetup----登录权限控制
   component（组件）
   -----authorization----用户登录授权
   -----inputToast----用户输入框
   -----msg----排队位置设置提示
   ----toast----小土司
   ----userInfo----用户的信息弹框
   getUserOpenId（获取用户唯一标识）
   icon（图片存放）
   pages（页面存放）
   util（小工具包）
   app.js---全局
   app.json----全局配置（对微信小程序进行全局配置，决定页面文件的路径、窗口表现、设置网络超时时间、设置多 tab 等）
   app.wxss----全局样式
   project.config----项目配置文件（配置appid，等）
   sitemap.json----文件用来配置小程序及其页面是否允许被微信索引。
const fs = require('fs');
const getConfig = configFilePath => {
    if (!fs.existsSync(configFilePath)) {
        throw new Error('配置文件不存在, 可使用 branch init <项目根目录路径> 初始化');
    } else {
        const jsonRes = fs.readFileSync(configFilePath);
        const jsonObj = JSON.parse(jsonRes);
        return jsonObj;
    }
};

module.exports = getConfig;

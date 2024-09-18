const { exec, cd } = require('shelljs');
const fs = require('fs');
const path = require('path');
const clc = require('cli-color');
const { Command } = require('commander');
const program = new Command();
const getConfig = require('./repository');

const pre = 'mt_';

const configFileName = 'branch.config.json';
const configPath = path.resolve(path.join(__dirname, '..', configFileName));
console.log('configPath', configPath);

// exec(`chcp 65001`);

program.name('mt branch util').description('CLI to some mt branch').version('0.0.1');

program
    .command('init')
    .description('初始化仓库信息')
    .argument('<rootPath>', 'root path')
    .action(rootPath => {
        const isAbsolute = path.isAbsolute(rootPath);
        const realPath = isAbsolute ? rootPath : path.join(__dirname, rootPath);
        const allFiles = fs.readdirSync(rootPath, { withFileTypes: true });

        const configContent = { repolist: [], rootPath: realPath };
        for (const file of allFiles) {
            if (!file.isDirectory()) continue;
            console.log(path.join(realPath, file.name));
            cd(path.join(realPath, file.name));

            const execRes = exec(`git branch -a`, { silent: true });
            if (execRes.code !== 0) continue;
            configContent.repolist.push(file.name);
        }

        cd(__dirname);

        fs.writeFileSync('../branch.config.json', JSON.stringify(configContent, null, 2));
    });

program
    .command('ls')
    .description('查看所有仓库')
    .action(() => {
        const allRepositoryName = getConfig(configPath).repolist;
        allRepositoryName.forEach((repoName, index) => {
            console.log(`${index}. ${clc.magentaBright(repoName)}`);
        });
    });

program
    .command('location')
    .description('检查当前所处分支')
    .action(() => {
        const { repolist: allRepositoryName, rootPath } = getConfig(configPath);
        allRepositoryName.forEach((appName, index) => {
            const appFullPath = path.join(rootPath, appName);
            if (!fs.existsSync(appFullPath)) {
                throw new Error('dir is not exsit : ', appName);
            }
            cd(appFullPath);
            const execRes = exec(`git branch -a`, { silent: true }).stdout;
            // execRes 的结果是 每一行一条分支名称  所以根据\n拆分成数组
            const branchRes = execRes.split('\n').map(branch => branch.trim());
            const currentBranch = branchRes.find(item => item.startsWith('* ')).replace('* ', '');
            console.log(clc.magentaBright(`${appName}:`), currentBranch);
        });
    });

program
    .command('ca')
    .description('切换所有分支 checkout all')
    .argument('<string>', '新分支名称')
    // .option('-o, --origin <string>', '原分支名称')
    // .option('-t, --targetBranch <string>', '新分支名称')
    // .option('--first', 'display just the first substring')
    .action(option => {
        console.log('targetBranch:', option);
        const { repolist: allRepositoryName, rootPath } = getConfig(configPath);
        for (const appName of allRepositoryName) {
            const appFullPath = path.resolve(rootPath, appName);
            console.log(clc.magentaBright(`------------${appName} start------------`));
            console.log(clc.greenBright(`repository path : ${appFullPath}`));
            if (!fs.existsSync(appFullPath)) {
                throw new Error('dir is not exsit : ', appName);
            }
            cd(appFullPath);
            exec(`git checkout ${option}`);
            exec(`git pull`);
            console.log(clc.magentaBright(`------------${appName} end------------`));
            console.log('\r');
            console.log('\r');
            console.log('\r');
        }
    });

program.parse();

function run(appFullPath, originBranchName, newBranchName) {
    cd(appFullPath);
    exec(`git checkout ${originBranchName}`);
    exec(`git pull`);
    exec(`git checkout -b ${newBranchName}`);
    exec(`git push --set-upstream origin ${newBranchName}`);
}

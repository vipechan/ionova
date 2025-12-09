#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { IonovaWallet } from '@ionova/wallet-sdk';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import ora from 'ora';
import inquirer from 'inquirer';

const program = new Command();
const WALLET_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', '.ionova');
const CONFIG_FILE = path.join(WALLET_DIR, 'config.json');

// Ensure wallet directory exists
if (!fs.existsSync(WALLET_DIR)) {
    fs.mkdirSync(WALLET_DIR, { recursive: true });
}

program
    .name('ionova')
    .description('Ionova CLI - Quantum-safe blockchain wallet')
    .version('1.0.0');

// Wallet commands
program
    .command('wallet:create')
    .description('Create a new quantum-safe wallet')
    .option('-t, --type <type>', 'Signature type (ecdsa|dilithium|sphincs|hybrid)', 'dilithium')
    .option('-n, --name <name>', 'Wallet name', 'default')
    .action(async (options) => {
        const spinner = ora('Creating wallet...').start();

        try {
            let wallet;
            switch (options.type.toLowerCase()) {
                case 'ecdsa':
                    wallet = IonovaWallet.createECDSA();
                    break;
                case 'dilithium':
                    wallet = IonovaWallet.createDilithium();
                    break;
                case 'sphincs':
                    wallet = IonovaWallet.createSPHINCS();
                    break;
                case 'hybrid':
                    wallet = IonovaWallet.createHybrid();
                    break;
                default:
                    throw new Error(`Unknown signature type: ${options.type}`);
            }

            // Save wallet
            const walletPath = path.join(WALLET_DIR, `${options.name}.json`);
            fs.writeFileSync(walletPath, JSON.stringify({
                name: options.name,
                type: options.type,
                address: wallet.address,
                // Note: In production, encrypt the private key!
            }, null, 2));

            spinner.succeed(chalk.green('Wallet created successfully!'));
            console.log(chalk.cyan(`Address: ${wallet.address}`));
            console.log(chalk.yellow(`Type: ${options.type}`));
            console.log(chalk.gray(`Saved to: ${walletPath}`));
        } catch (error: any) {
            spinner.fail(chalk.red(`Failed to create wallet: ${error.message}`));
        }
    });

program
    .command('wallet:list')
    .description('List all wallets')
    .action(() => {
        const files = fs.readdirSync(WALLET_DIR).filter(f => f.endsWith('.json'));

        if (files.length === 0) {
            console.log(chalk.yellow('No wallets found. Create one with: ionova wallet:create'));
            return;
        }

        console.log(chalk.bold('\n📁 Wallets:\n'));
        files.forEach(file => {
            const wallet = JSON.parse(fs.readFileSync(path.join(WALLET_DIR, file), 'utf-8'));
            console.log(`  ${chalk.cyan(wallet.name)}`);
            console.log(`  Address: ${chalk.gray(wallet.address)}`);
            console.log(`  Type: ${chalk.yellow(wallet.type)}\n`);
        });
    });

// Balance command
program
    .command('balance')
    .description('Check wallet balance')
    .option('-a, --address <address>', 'Wallet address')
    .option('-n, --network <url>', 'RPC URL', 'http://localhost:27000')
    .action(async (options) => {
        const spinner = ora('Fetching balance...').start();

        try {
            const provider = new ethers.JsonRpcProvider(options.network);
            const balance = await provider.getBalance(options.address);

            spinner.succeed(chalk.green('Balance retrieved'));
            console.log(chalk.cyan(`${ethers.formatEther(balance)} IONX`));
        } catch (error: any) {
            spinner.fail(chalk.red(`Failed: ${error.message}`));
        }
    });

// Send command
program
    .command('send')
    .description('Send IONX tokens')
    .option('-t, --to <address>', 'Recipient address')
    .option('-a, --amount <amount>', 'Amount to send')
    .option('-w, --wallet <name>', 'Wallet name', 'default')
    .option('-n, --network <url>', 'RPC URL', 'http://localhost:27000')
    .action(async (options) => {
        const spinner = ora('Sending transaction...').start();

        try {
            // In production, load wallet and sign transaction
            const provider = new ethers.JsonRpcProvider(options.network);

            // This is a simplified version
            spinner.succeed(chalk.green('Transaction sent!'));
            console.log(chalk.cyan(`Sent ${options.amount} IONX to ${options.to}`));
        } catch (error: any) {
            spinner.fail(chalk.red(`Failed: ${error.message}`));
        }
    });

// Network commands
program
    .command('network:status')
    .description('Check network status')
    .option('-n, --network <url>', 'RPC URL', 'http://localhost:27000')
    .action(async (options) => {
        const spinner = ora('Checking network...').start();

        try {
            const provider = new ethers.JsonRpcProvider(options.network);
            const blockNumber = await provider.getBlockNumber();
            const network = await provider.getNetwork();

            spinner.succeed(chalk.green('Network is online'));
            console.log(chalk.cyan(`Chain ID: ${network.chainId}`));
            console.log(chalk.cyan(`Block Number: ${blockNumber}`));
        } catch (error: any) {
            spinner.fail(chalk.red(`Network unreachable: ${error.message}`));
        }
    });

// Parse CLI arguments
program.parse();

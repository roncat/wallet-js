// Importação das dependências
const readline = require('readline');
require('dotenv').config();

// Importa o serviço de carteira
//const WalletService = require('./WalletService');
const WalletService = require('./WalletService.js');

// Inicializa o serviço com as variáveis de ambiente
const walletService = new WalletService(
  process.env.BLOCKCHAIN_NODE,
  process.env.SYMBOL
);

// Configuração do readline para interação com o usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função auxiliar para fazer perguntas ao usuário
const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

/**
 * Cria uma nova carteira
 */
async function createWallet() {
  try {
    console.log('\n--- Criando Nova Carteira ---\n');
    
    const wallet = walletService.createWallet();
    
    console.log('✅ Carteira criada com sucesso!\n');
    console.log(`📍 Endereço: ${wallet.address}`);
    console.log(`🔑 Private Key: ${wallet.privateKey}`);
    console.log(`📝 Mnemonic: ${wallet.mnemonic}`);
    
    const save = await question('\nDeseja salvar a private key no arquivo .env? (s/n): ');
    
    if (save.toLowerCase() === 's') {
      console.log('\n⚠️  ATENÇÃO: Guarde sua private key em local seguro!');
      console.log(`Adicione manualmente ao .env: PRIVATE_KEY=${wallet.privateKey}`);
    }
    
    console.log('\n⚠️  IMPORTANTE: Nunca compartilhe sua private key ou mnemonic!');
    
  } catch (error) {
    console.error('❌ Erro ao criar carteira:', error.message);
  }
}

/**
 * Recupera uma carteira existente
 */
async function recoverWallet() {
  try {
    console.log('\n--- Recuperar Carteira ---\n');
    console.log('1 - Recuperar via Private Key');
    console.log('2 - Recuperar via Mnemonic');
    
    const option = await question('\nEscolha uma opção: ');
    
    let wallet;
    
    if (option === '1') {
      const privateKey = await question('Digite a Private Key: ');
      wallet = walletService.recoverFromPrivateKey(privateKey);
      
    } else if (option === '2') {
      const mnemonic = await question('Digite o Mnemonic (12 ou 24 palavras): ');
      wallet = walletService.recoverFromMnemonic(mnemonic);
      
    } else {
      console.log('❌ Opção inválida!');
      return;
    }
    
    console.log('\n✅ Carteira recuperada com sucesso!');
    console.log(`📍 Endereço: ${wallet.address}`);
    
  } catch (error) {
    console.error('❌ Erro ao recuperar carteira:', error.message);
  }
}

/**
 * Consulta o saldo de um endereço
 */
async function getBalance() {
  try {
    console.log('\n--- Consultar Saldo ---\n');
    
    const address = await question('Digite o endereço da carteira: ');
    
    if (!walletService.isValidAddress(address)) {
      console.log('❌ Endereço inválido!');
      return;
    }
    
    console.log('\n⏳ Consultando saldo...');
    
    const balance = await walletService.getBalance(address);
    
    console.log(`\n💰 Saldo: ${balance.formatted}`);
    
  } catch (error) {
    console.error('❌ Erro ao consultar saldo:', error.message);
  }
}

/**
 * Envia uma transação
 */
async function sendTx() {
  try {
    console.log('\n--- Enviar Transação ---\n');
    
    const privateKey = await question('Digite sua Private Key: ');
    const toAddress = await question('Digite o endereço do destinatário: ');
    const amount = await question(`Digite o valor a enviar (em ${walletService.getSymbol()}): `);
    
    if (!walletService.isValidAddress(toAddress)) {
      console.log('❌ Endereço de destino inválido!');
      return;
    }
    
    console.log(`\n📤 Enviando ${amount} ${walletService.getSymbol()}...`);
    
    const tx = await walletService.sendTransaction(privateKey, toAddress, amount);
    
    console.log('\n✅ Transação enviada com sucesso!');
    console.log(`🔗 Hash: ${tx.hash}`);
    console.log('\n⏳ Aguardando confirmação...');
    
    const receipt = await tx.wait();
    
    console.log(`✅ Transação confirmada no bloco: ${receipt.blockNumber}`);
    
  } catch (error) {
    console.error('❌ Erro ao enviar transação:', error.message);
  }
}

/**
 * Busca informações de uma transação
 */
async function searchTx() {
  try {
    console.log('\n--- Buscar Transação ---\n');
    
    const txHash = await question('Digite o hash da transação: ');
    
    console.log('\n⏳ Buscando transação...');
    
    const tx = await walletService.getTransaction(txHash);
    
    if (!tx) {
      console.log('❌ Transação não encontrada!');
      return;
    }
    
    console.log('\n📋 Detalhes da Transação:');
    console.log(`├─ From: ${tx.from}`);
    console.log(`├─ To: ${tx.to}`);
    console.log(`├─ Value: ${tx.valueFormatted}`);
    console.log(`├─ Block Number: ${tx.blockNumber}`);
    console.log(`└─ Confirmations: ${tx.confirmations}`);
    
  } catch (error) {
    console.error('❌ Erro ao buscar transação:', error.message);
  }
}

/**
 * Exibe o menu principal
 */
function showMenu() {
  console.log('\n==== myWallet ====\n');
  console.log('1 - Criar carteira');
  console.log('2 - Recuperar carteira');
  console.log('3 - Consultar saldo');
  console.log('4 - Enviar transação');
  console.log('5 - Buscar transação');
  console.log('0 - Sair');
  console.log('');
}

/**
 * Função principal
 */
async function main() {
  console.log('\n🚀 Bem-vindo ao myWallet!');
  console.log(`📡 Conectado à rede: ${process.env.BLOCKCHAIN_NODE}`);
  console.log(`💎 Moeda: ${walletService.getSymbol()}`);
  
  let running = true;
  
  while (running) {
    showMenu();
    
    const option = await question('Escolha uma opção: ');
    
    switch (option) {
      case '1':
        await createWallet();
        break;
      case '2':
        await recoverWallet();
        break;
      case '3':
        await getBalance();
        break;
      case '4':
        await sendTx();
        break;
      case '5':
        await searchTx();
        break;
      case '0':
        console.log('\n👋 Até logo!\n');
        running = false;
        break;
      default:
        console.log('\n❌ Opção inválida! Tente novamente.');
    }
  }
  
  rl.close();
}

// Inicia a aplicação
main().catch(console.error);
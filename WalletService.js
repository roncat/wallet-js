// Serviço responsável por todas as interações com a blockchain
const { ethers } = require('ethers');

class WalletService {
  /**
   * Construtor do serviço
   * @param {string} rpcUrl - URL do nó da blockchain
   * @param {string} symbol - Símbolo da moeda nativa
   */
  constructor(rpcUrl, symbol) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.symbol = symbol || 'ETH';
  }

  /**
   * Cria uma nova carteira aleatória
   * @returns {Object} Dados da carteira (address, privateKey, mnemonic)
   */
  createWallet() {
    const wallet = ethers.Wallet.createRandom();
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase
    };
  }

  /**
   * Recupera carteira via private key
   * @param {string} privateKey - Chave privada
   * @returns {Object} Dados da carteira recuperada
   */
  recoverFromPrivateKey(privateKey) {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    
    return {
      address: wallet.address
    };
  }

  /**
   * Recupera carteira via mnemonic
   * @param {string} mnemonic - Frase mnemônica (12 ou 24 palavras)
   * @returns {Object} Dados da carteira recuperada
   */
  recoverFromMnemonic(mnemonic) {
    const wallet = ethers.Wallet.fromPhrase(mnemonic, this.provider);
    
    return {
      address: wallet.address
    };
  }

  /**
   * Valida se um endereço é válido
   * @param {string} address - Endereço a validar
   * @returns {boolean} True se válido
   */
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  /**
   * Consulta o saldo de um endereço
   * @param {string} address - Endereço da carteira
   * @returns {Object} Saldo em Wei e Ether
   */
  async getBalance(address) {
    const balanceWei = await this.provider.getBalance(address);
    const balanceEther = ethers.formatEther(balanceWei);
    
    return {
      wei: balanceWei.toString(),
      ether: balanceEther,
      formatted: `${balanceEther} ${this.symbol}`
    };
  }

  /**
   * Envia uma transação
   * @param {string} privateKey - Chave privada do remetente
   * @param {string} toAddress - Endereço do destinatário
   * @param {string} amount - Valor em Ether
   * @returns {Object} Dados da transação enviada
   */
  async sendTransaction(privateKey, toAddress, amount) {
    // Cria wallet conectada ao provider
    const wallet = new ethers.Wallet(privateKey, this.provider);
    
    // Envia a transação
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amount)
    });
    
    return {
      hash: tx.hash,
      from: wallet.address,
      to: toAddress,
      amount: amount,
      // Método para aguardar confirmação
      wait: async () => {
        const receipt = await tx.wait();
        return {
          blockNumber: receipt.blockNumber,
          status: receipt.status
        };
      }
    };
  }

  /**
   * Busca informações de uma transação
   * @param {string} txHash - Hash da transação
   * @returns {Object|null} Dados da transação ou null se não encontrada
   */
  async getTransaction(txHash) {
    const tx = await this.provider.getTransaction(txHash);
    
    if (!tx) {
      return null;
    }
    
    // Obtém recibo e bloco atual para calcular confirmações
    const receipt = await this.provider.getTransactionReceipt(txHash);
    const currentBlock = await this.provider.getBlockNumber();
    const confirmations = receipt ? currentBlock - receipt.blockNumber + 1 : 0;
    
    return {
      from: tx.from,
      to: tx.to,
      value: ethers.formatEther(tx.value),
      valueFormatted: `${ethers.formatEther(tx.value)} ${this.symbol}`,
      blockNumber: tx.blockNumber || 'Pendente',
      confirmations: confirmations
    };
  }

  /**
   * Retorna o símbolo da moeda
   * @returns {string} Símbolo configurado
   */
  getSymbol() {
    return this.symbol;
  }
}

module.exports = WalletService;
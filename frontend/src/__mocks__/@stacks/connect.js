// Mock Stacks Connect for testing
export const showConnect = jest.fn().mockResolvedValue({
  userSession: {
    isUserSignedIn: () => true,
    loadUserData: () => ({
      profile: {
        stxAddress: {
          mainnet: 'SP1ABC123DEF456GHI789',
          testnet: 'ST1ABC123DEF456GHI789'
        }
      }
    })
  }
});

export const openContractCall = jest.fn().mockResolvedValue({
  txId: 'SP123ABC456DEF789GHI'
});

export const openSTXTransfer = jest.fn().mockResolvedValue({
  txId: 'SP123ABC456DEF789GHI'
});

export const StacksMainnet = {
  name: 'mainnet',
  chainId: 1,
  coreApiUrl: 'https://api.mainnet.hiro.so'
};

export const StacksTestnet = {
  name: 'testnet',
  chainId: 2147483648,
  coreApiUrl: 'https://api.testnet.hiro.so'
};
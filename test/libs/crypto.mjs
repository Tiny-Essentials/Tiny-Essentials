import { hashText } from '../../dist/v1/basics/text.mjs';

const executeCrypto = async () => {
  try {
    const hash = await hashText('yay', 'SHA-256');
    console.log('Text: ', 'yay');
    console.log('Text hash: ', hash);
  } catch (err) {
    console.error(err);
  }
};

export default executeCrypto;

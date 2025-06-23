const parser = require('@babel/parser');

const { readFile } = require('./file');

/**
 * @param {string} fileName
 * @returns {Promise<parser.ParseResult<import('@babel/types').File>>}
 */
async function getAst(fileName) {
  const code = await readFile(fileName);
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
  return ast;
}

module.exports = {
  getAst,
};

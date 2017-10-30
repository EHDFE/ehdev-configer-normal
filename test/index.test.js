const path = require('path');
process.env.SHELL_NODE_MODULES_PATH = path.join(process.cwd(), 'node_modules');

const { expect } = require('chai');
const { getProdConfig, getDevConfig, DEFAULT_PROJECT_CONFIG } = require('../index');

describe('exports methods: <<getProdConfig>> and <<getDevConfig>>', () => {

  it('<<getProdConfig>> is a function', () => {
    expect(getProdConfig).to.be.a('function');
  });
  it('<<getDevConfig>> is a function', () => {
    expect(getDevConfig).to.be.a('function');
  });

});
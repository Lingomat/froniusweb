import { newE2EPage } from '@stencil/core/testing';

describe('fronweb-component', () => {
  it('renders', async () => {
    const page = await newE2EPage();

    await page.setContent('<fronweb-component></fronweb-component>');
    const element = await page.find('fronweb-component');
    expect(element).toHaveClass('hydrated');
  });

});

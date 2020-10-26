import { uniqueProvidersByToken } from './utils';

describe('uniqueProvidersByToken', () => {
  it('Should return array with 1 provider', () => {
    const providers = uniqueProvidersByToken([
      { provide: 'tokenA', useValue: 10 },
      { provide: 'tokenA', useValue: 11 },
    ]);

    expect(providers.length).toEqual(1);
    expect(providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provide: 'tokenA', useValue: 11 }),
      ]),
    );
  });

  it('Should leave 2 different providers', () => {
    const providers = uniqueProvidersByToken([
      { provide: 'tokenA', useValue: 10 },
      { provide: 'tokenB', useValue: 11 },
    ]);

    expect(providers.length).toEqual(2);
    expect(providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provide: 'tokenB', useValue: 11 }),
        expect.objectContaining({ provide: 'tokenA', useValue: 10 }),
      ]),
    );
  });

  it('Should remove 1 provider and leave 2', () => {
    const providers = uniqueProvidersByToken([
      { provide: 'tokenA', useValue: 10 },
      { provide: 'tokenB', useValue: 10 },
      { provide: 'tokenB', useValue: 11 },
    ]);

    expect(providers.length).toEqual(2);
    expect(providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provide: 'tokenB', useValue: 11 }),
        expect.objectContaining({ provide: 'tokenA', useValue: 10 }),
      ]),
    );
  });

  it('Should leave all class providers', () => {
    class A {}
    class B {}
    class C {}

    const providers = uniqueProvidersByToken([A, B, C]);

    expect(providers.length).toEqual(3);
    expect(providers).toContain(A);
    expect(providers).toContain(B);
    expect(providers).toContain(C);
  });
});

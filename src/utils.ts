export function addDefaults(providers, defaults) {
  const providersList = [...providers];
  defaults.forEach(providerDefault => {
    const { provide } = providerDefault;
    const passedProvider = providers.find(
      provider => provider.provide === provide,
    );
    if (!passedProvider) {
      providersList.push(providerDefault);
    }
  });
  return providersList;
}

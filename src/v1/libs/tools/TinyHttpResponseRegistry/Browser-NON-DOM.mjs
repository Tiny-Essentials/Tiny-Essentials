import TinyI18Browser from '../../text/TinyI18/Browser-NON-DOM.mjs';
import TinyHttpResponseRegistry from './index.mjs';

/**
 * A centralized registry designed for managing HTTP response metadata.
 * It provides strict data validation and integrated internationalization (i18n) support,
 * enabling the retrieval of localized response names, summaries, and descriptions
 * while preventing accidental state mutation.
 */
class TinyHttpResponseRegistryBrowser extends TinyHttpResponseRegistry {
  /**
   * Initializes a new instance of the TinyHttpResponseRegistry.
   * @param {import('./JsDoc.mjs').HttpResponses} [initialResponses] - An object of initial response objects to populate the registry.
   * @throws {TypeError} If the input is not an object.
   */
  constructor(initialResponses) {
    super(TinyI18Browser, initialResponses);
  }
}

export default TinyHttpResponseRegistryBrowser;

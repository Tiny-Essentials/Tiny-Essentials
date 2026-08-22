/**
 * @typedef {import('bootstrap').Modal} Modal
 */

/**
 * @typedef {typeof import('bootstrap').Modal} ModalClass
 */

/**
 * @typedef {Object} CustomElementConfig
 * @property {string} [className] - CSS classes to be added to the element.
 * @property {Object<string, string|null>} [styles] - CSS properties and values (e.g., { 'background-color': '#000' }).
 */

/**
 * @typedef {Object} ModalOptions - Configuration options for the dialog content and buttons.
 * @property {string} [title] - The text to be displayed in the modal header.
 * @property {string} [confirmText] - The text to be displayed on the primary confirmation button.
 * @property {string} [cancelText] - The text to be displayed on the secondary cancel button.
 * @property {string} [defaultValue] - The initial value for the input field (used in prompts).
 * @property {CustomElementConfig} [modalConfig] - Customization for the main modal container.
 * @property {CustomElementConfig} [headerConfig] - Customization for the modal header.
 * @property {CustomElementConfig} [titleConfig] - Customization for the modal title.
 * @property {CustomElementConfig} [closeBtnConfig] - Customization for the close button.
 * @property {CustomElementConfig} [bodyConfig] - Customization for the modal body.
 * @property {CustomElementConfig} [footerConfig] - Customization for the modal footer.
 * @property {CustomElementConfig} [confirmBtnConfig] - Customization for the confirm button.
 * @property {CustomElementConfig} [cancelBtnConfig] - Customization for the cancel button.
 * @property {CustomElementConfig} [contentConfig] - Customization for the modal content container.
 * @property {CustomElementConfig} [dialogConfig] - Customization for the modal dialog wrapper.
 */

/**
 * Utility to replace native alert/confirm/prompt with Bootstrap 5 modals.
 * Built with strict DOM manipulation to prevent XSS.
 */
class BootstrapDialogs {
  /** @type {Modal|null} */
  static _activeInstance = null;
  /** @type {Modal|null} */
  static _loadingInstance = null;
  /** @type {HTMLElement|null} */
  static _modalElement = null;
  /** @type {HTMLElement|null} */
  static _loadingElement = null;
  /** @type {Function|null} */
  static _activeResolve = null;
  /** @type {'alert'|'confirm'|'prompt'|null} */
  static _activeType = null;

  /** @type {ModalClass|null} */
  static #Modal = null;

  /**
   * Default configurations for all modal elements to ensure consistent look.
   * @type {Object<string, CustomElementConfig>}
   */
  static #defaultConfig = {
    modalConfig: { className: '', styles: {} },
    dialogConfig: { className: '', styles: {} },
    contentConfig: { className: '', styles: {} },
    headerConfig: { className: '', styles: {} },
    titleConfig: { className: '', styles: {} },
    closeBtnConfig: { className: '', styles: {} },
    bodyConfig: { className: '', styles: {} },
    footerConfig: { className: '', styles: {} },
    confirmBtnConfig: { className: '', styles: {} },
    cancelBtnConfig: { className: '', styles: {} },
  };

  /**
   * Gets a deep copy of the default configuration.
   * @returns {Object<string, CustomElementConfig>}
   */
  static get defaultConfig() {
    return structuredClone(this.#defaultConfig);
  }

  /**
   * Sets the entire default configuration.
   * @param {Object<string, CustomElementConfig>} config - The new default configuration.
   * @throws {TypeError} If the configuration is invalid.
   */
  static set defaultConfig(config) {
    this._validateOptions(config);
    this.#defaultConfig = structuredClone(config);
  }

  /**
   * Sets the Modal class constructor (e.g., Bootstrap's Modal).
   * @param {ModalClass} Modal - The Bootstrap Modal class constructor.
   * @throws {Error} If a Modal class has already been set.
   */
  static set Modal(Modal) {
    if (BootstrapDialogs.#Modal !== null)
      throw new Error('Modal class has already been initialized.');
    BootstrapDialogs.#Modal = Modal;
  }

  /**
   * Gets the currently set Modal class constructor.
   * @returns {ModalClass} The currently configured Modal class.
   * @throws {Error} If no Modal class has been set.
   */
  static get Modal() {
    if (BootstrapDialogs.#Modal === null) throw new Error('Modal class has not been initialized.');
    return BootstrapDialogs.#Modal;
  }

  /**
   * Updates a specific configuration key by merging it with existing defaults.
   * @param {string} key - The key within #defaultConfig to update.
   * @param {CustomElementConfig} config - The partial or full configuration to merge.
   * @private
   */
  static _updateConfigKey(key, config) {
    if (!(key in this.#defaultConfig)) {
      throw new Error(`Invalid configuration key: ${key}`);
    }

    // Merge existing defaults with the new partial configuration
    const updatedConfig = {
      ...this.#defaultConfig[key],
      ...config,
      // Deep merge for styles object
      styles: {
        ...(this.#defaultConfig[key].styles || {}),
        ...(config.styles || {}),
      },
    };

    // Validate the merged object
    const validationWrapper = { [key]: updatedConfig };
    this._validateOptions(validationWrapper);

    this.#defaultConfig[key] = updatedConfig;
  }

  // --- Individual Configuration Setters ---

  /** @param {CustomElementConfig} cfg */
  static setModalConfig(cfg) {
    this._updateConfigKey('modalConfig', cfg);
  }
  /** @param {CustomElementConfig} cfg */
  static setHeaderConfig(cfg) {
    this._updateConfigKey('headerConfig', cfg);
  }
  /** @param {CustomElementConfig} cfg */
  static setTitleConfig(cfg) {
    this._updateConfigKey('titleConfig', cfg);
  }
  /** @param {CustomElementConfig} cfg */
  static setCloseBtnConfig(cfg) {
    this._updateConfigKey('closeBtnConfig', cfg);
  }
  /** @param {CustomElementConfig} cfg */
  static setBodyConfig(cfg) {
    this._updateConfigKey('bodyConfig', cfg);
  }
  /** @param {CustomElementConfig} cfg */
  static setFooterConfig(cfg) {
    this._updateConfigKey('footerConfig', cfg);
  }
  /** @param {CustomElementConfig} cfg */
  static setConfirmBtnConfig(cfg) {
    this._updateConfigKey('confirmBtnConfig', cfg);
  }
  /** @param {CustomElementConfig} cfg */
  static setCancelBtnConfig(cfg) {
    this._updateConfigKey('cancelBtnConfig', cfg);
  }
  /** @param {CustomElementConfig} cfg */
  static setContentConfig(cfg) {
    this._updateConfigKey('contentConfig', cfg);
  }
  /** @param {CustomElementConfig} cfg */
  static setDialogConfig(cfg) {
    this._updateConfigKey('dialogConfig', cfg);
  }

  /**
   * Helper to forcefully clean up body styles injected by Bootstrap JS.
   * @returns {void}
   */
  static _restoreBody() {
    const hasDialog = this._modalElement;
    const hasLoading = this._loadingElement;

    // If no modal managed by this class is open, force body cleaning
    if (!hasDialog && !hasLoading) {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
    }
  }

  /**
   * Applies custom classes and styles to a given element.
   * Combines default configurations with user-provided overrides.
   * @param {HTMLElement} element - The target element.
   * @param {CustomElementConfig} [defaultConfig] - The default configuration.
   * @param {CustomElementConfig} [userConfig] - The user customization.
   * @private
   */
  static _applyCustomizations(element, defaultConfig, userConfig) {
    // 1. Apply Classes (Additive)
    const defaultClasses = defaultConfig?.className?.split(' ').filter(Boolean) ?? [];
    const userClasses = userConfig?.className?.split(' ').filter(Boolean) ?? [];
    // Splits by space and filters out empty strings to handle multiple classes correctly
    element.classList.add(...defaultClasses, ...userClasses);

    // 2. Apply Styles (User overrides defaults)
    const combinedStyles = {
      ...(defaultConfig?.styles || {}),
      ...(userConfig?.styles || {}),
    };

    for (const [property, value] of Object.entries(combinedStyles)) {
      element.style.setProperty(property, value);
    }
  }

  /**
   * Validates the ModalOptions object deeply.
   * @param {ModalOptions} options - The options to validate.
   * @throws {TypeError} If validation fails.
   * @private
   */
  static _validateOptions(options) {
    if (typeof options !== 'object' || options === null) {
      throw new TypeError('Options must be a non-null object.');
    }

    const configKeys = [
      'modalConfig',
      'headerConfig',
      'titleConfig',
      'bodyConfig',
      'footerConfig',
      'confirmBtnConfig',
      'cancelBtnConfig',
      'closeBtnConfig',
      'contentConfig',
      'dialogConfig',
    ];

    for (const key of configKeys) {
      // @ts-ignore
      if (options[key] !== undefined) {
        // @ts-ignore
        const config = options[key];
        if (typeof config !== 'object' || config === null) {
          throw new TypeError(`The property "${key}" must be an object.`);
        }
        if (config.className !== undefined && typeof config.className !== 'string') {
          throw new TypeError(`The "className" property in "${key}" must be a string.`);
        }
        if (config.styles !== undefined) {
          if (typeof config.styles !== 'object' || config.styles === null) {
            throw new TypeError(`The "styles" property in "${key}" must be an object.`);
          }
          for (const styleKey of Object.keys(config.styles)) {
            if (typeof config.styles[styleKey] !== 'string') {
              throw new TypeError(
                `The style property "${styleKey}" in "${key}" must have a string value.`,
              );
            }
          }
        }
      }
    }
  }

  /**
   * Displays a simple alert modal.
   * @param {string} message - The text message to be displayed to the user.
   * @param {ModalOptions} [options={}] - Configuration options for the alert modal.
   * @returns {Promise<void>} A promise that resolves when the alert is closed.
   */
  static async alert(message, options = {}) {
    const title = options.title ?? 'Alert';
    const confirmText = options.confirmText ?? 'OK';
    await this._show(title, message, false, confirmText, null, 'alert', options);
  }

  /**
   * Displays a confirmation modal.
   * @param {string} message - The question or message to be displayed to the user.
   * @param {ModalOptions} [options={}] - Configuration options for the confirmation modal.
   * @returns {Promise<boolean>} A promise that resolves with true if confirmed, or false if cancelled.
   */
  static async confirm(message, options = {}) {
    const title = options.title ?? 'Confirm';
    const confirmText = options.confirmText ?? 'Yes';
    const cancelText = options.cancelText ?? 'No';
    return await this._show(title, message, true, confirmText, cancelText, 'confirm', options);
  }

  /**
   * Displays a prompt modal with an input field.
   * @param {string} message - The instruction or question for the user.
   * @param {string} [defaultValue=''] - The initial value for the input field.
   * @param {ModalOptions} [options={}] - Configuration options for the prompt modal.
   * @returns {Promise<string|null>} A promise that resolves with the input value, or null if cancelled.
   */
  static async prompt(message, defaultValue = '', options = {}) {
    const title = options.title ?? 'Prompt';
    const confirmText = options.confirmText ?? 'Submit';
    const cancelText = options.cancelText ?? 'Cancel';

    // Build prompt body with an input element
    const bodyContainer = document.createElement('div');
    const textNode = document.createElement('div');
    textNode.textContent = message;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control mt-2';
    input.id = 'bs-prompt-input';
    input.value = defaultValue;

    bodyContainer.append(textNode, input);

    return await this._show(title, bodyContainer, true, confirmText, cancelText, 'prompt', options);
  }

  /**
   * Displays a global, non-dismissible loading overlay for background/DB tasks.
   * @param {string} [message='Processing...'] - The text to display while the loading state is active.
   * @returns {void}
   */
  static showLoading(message = 'Processing...') {
    if (this._loadingInstance) return; // Prevent multiple loading overlays

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'bs-loading-modal';
    modal.setAttribute('data-bs-backdrop', 'static');
    modal.setAttribute('data-bs-keyboard', 'false');
    modal.style.zIndex = '1070';

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog modal-dialog-centered modal-sm';

    const content = document.createElement('div');
    content.className = 'modal-content bg-transparent border-0 shadow-none';

    const body = document.createElement('div');
    body.className =
      'modal-body text-center d-flex flex-column align-items-center justify-content-center';

    const spinner = document.createElement('div');
    spinner.className = 'spinner-border text-primary shadow-sm mb-3';
    spinner.setAttribute('role', 'status');
    spinner.style.width = '4rem';
    spinner.style.height = '4rem';

    const title = document.createElement('h5');
    title.className = 'fw-bold text-white shadow-sm px-4 py-2 rounded bg-dark bg-opacity-75';
    title.textContent = message;

    body.append(spinner, title);
    content.appendChild(body);
    dialog.appendChild(content);
    modal.appendChild(dialog);

    document.body.appendChild(modal);
    this._loadingElement = modal;
    this._loadingInstance = new BootstrapDialogs.Modal(modal, {
      backdrop: 'static',
      keyboard: false,
    });
    this._loadingInstance.show();
  }

  /**
   * Hides and destroys the active loading overlay.
   * @returns {void}
   */
  static hideLoading() {
    if (this._loadingInstance) {
      this._loadingInstance.hide();
      this._loadingInstance.dispose();
      this._loadingInstance = null;
    }

    if (this._loadingElement) {
      this._loadingElement.remove();
      this._loadingElement = null;
    }

    this._restoreBody();
  }

  /**
   * Core method to build the modal DOM structure safely.
   * @param {string} titleText - The text to be placed in the modal header.
   * @param {HTMLElement|string} bodyContent - The content to be placed in the modal body.
   * @param {boolean} showCancel - Whether to display the cancel button.
   * @param {string} confirmText - The text for the confirmation button.
   * @param {string|null} [cancelText='Cancel'] - The text for the cancel button.
   * @param {ModalOptions} [options={}] - Configuration options for customization.
   * @returns {HTMLElement} The constructed modal element.
   */
  static _buildModalElement(
    titleText,
    bodyContent,
    showCancel,
    confirmText,
    cancelText = 'Cancel',
    options = {},
  ) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.zIndex = '1065';
    this._applyCustomizations(modal, this.#defaultConfig.modalConfig, options.modalConfig);

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog modal-dialog-centered';
    this._applyCustomizations(dialog, this.#defaultConfig.dialogConfig, options.dialogConfig);

    const content = document.createElement('div');
    content.className = 'modal-content shadow-lg border-0';
    this._applyCustomizations(content, this.#defaultConfig.contentConfig, options.contentConfig);

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header bg-body-tertiary';
    this._applyCustomizations(header, this.#defaultConfig.headerConfig, options.headerConfig);

    const title = document.createElement('h5');
    title.className = 'modal-title fw-bold';
    title.textContent = titleText;
    this._applyCustomizations(title, this.#defaultConfig.titleConfig, options.titleConfig);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('data-bs-dismiss', 'modal');
    closeBtn.setAttribute('aria-label', 'Close');
    this._applyCustomizations(closeBtn, this.#defaultConfig.closeBtnConfig, options.closeBtnConfig);

    header.append(title, closeBtn);

    // Body
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.style.whiteSpace = 'pre-wrap';
    this._applyCustomizations(body, this.#defaultConfig.bodyConfig, options.bodyConfig);

    if (bodyContent instanceof Node) {
      body.appendChild(bodyContent);
    } else {
      body.textContent = bodyContent;
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer border-top-0 pt-0';
    this._applyCustomizations(footer, this.#defaultConfig.footerConfig, options.footerConfig);

    if (showCancel) {
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.setAttribute('data-bs-dismiss', 'modal');
      cancelBtn.textContent = cancelText;
      this._applyCustomizations(
        cancelBtn,
        this.#defaultConfig.cancelBtnConfig,
        options.cancelBtnConfig,
      );
      footer.appendChild(cancelBtn);
    }

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'btn btn-primary fw-bold px-4';
    confirmBtn.id = 'bs-modal-confirm';
    confirmBtn.textContent = confirmText;
    this._applyCustomizations(
      confirmBtn,
      this.#defaultConfig.confirmBtnConfig,
      options.confirmBtnConfig,
    );
    footer.appendChild(confirmBtn);

    content.append(header, body, footer);
    dialog.appendChild(content);
    modal.appendChild(dialog);

    return modal;
  }

  /**
   * Clean up any existing modal and resolve its promise.
   * @returns {void}
   */
  static _cleanup() {
    if (this._activeResolve) {
      /** @type {any} */
      let cancelValue;
      if (this._activeType === 'prompt') cancelValue = null;
      else if (this._activeType === 'confirm') cancelValue = false;
      else cancelValue = undefined;

      this._activeResolve(cancelValue);
      this._activeResolve = null;
    }

    if (this._activeInstance) {
      this._activeInstance.dispose();
      this._activeInstance = null;
    }

    if (this._modalElement) {
      this._modalElement.remove();
      this._modalElement = null;
    }

    this._restoreBody();
  }

  /**
   * Internal method to initialize the modal instance and handle lifecycle.
   * @param {string} title - The title text for the modal.
   * @param {HTMLElement|string} bodyContent - The content to be placed in the modal body.
   * @param {boolean} showCancel - Whether to include a cancel button.
   * @param {string} confirmText - The text for the confirmation button.
   * @param {string|null} [cancelText='Cancel'] - The text for the cancel button.
   * @param {'alert'|'confirm'|'prompt'} [type='alert'] - The type of dialog being shown.
   * @param {ModalOptions} [options={}] - Configuration options for customization.
   * @returns {Promise<any>} A promise that resolves with the user's action.
   */
  static _show(
    title,
    bodyContent,
    showCancel,
    confirmText,
    cancelText,
    type = 'alert',
    options = {},
  ) {
    this._validateOptions(options);
    this._cleanup();

    return new Promise((resolve) => {
      this._activeResolve = resolve;
      this._activeType = type;

      const modalElement = this._buildModalElement(
        title,
        bodyContent,
        showCancel,
        confirmText,
        cancelText,
        options,
      );
      this._modalElement = modalElement;
      document.body.appendChild(modalElement);

      const confirmBtn = modalElement.querySelector('#bs-modal-confirm');
      const inputField = modalElement.querySelector('#bs-prompt-input');

      if (!confirmBtn) {
        throw new Error('Critical Error: Confirm button not found in modal template.');
      }

      this._activeInstance = new BootstrapDialogs.Modal(modalElement);
      /** @type {boolean} */
      let isConfirmed = false;

      /**
       * Handles the confirmation action.
       */
      const handleConfirm = () => {
        isConfirmed = true;
        /** @type {any} */
        let value;
        if (type === 'prompt')
          value = inputField instanceof HTMLInputElement ? inputField.value : null;
        else if (type === 'confirm') value = true;
        else value = true;

        this._activeInstance?.hide();
        resolve(value);
      };

      confirmBtn.addEventListener('click', handleConfirm);

      // Handle cancel/close
      modalElement.addEventListener('hidden.bs.modal', () => {
        if (this._activeResolve === resolve) {
          if (!isConfirmed) {
            /** @type {any} */
            let value;
            if (type === 'prompt') value = null;
            else if (type === 'confirm') value = false;
            else value = undefined;
            resolve(value);
          }
          this._activeResolve = null;
          this._activeInstance = null;
        }
        modalElement.remove();
        this._restoreBody();
      });

      this._activeInstance.show();
      if (type === 'prompt' && inputField) {
        modalElement.addEventListener('shown.bs.modal', () => {
          if (!(inputField instanceof HTMLInputElement)) return;
          inputField.focus();
          inputField.select();
        });
      }
    });
  }
}

export { BootstrapDialogs };

/**
 * @param {string} msg - The message to display.
 * @param {ModalOptions} [options] - Configuration options for the alert.
 * @returns {Promise<void>}
 */
export const alert = (msg, options) => BootstrapDialogs.alert(msg, options);

/**
 * @param {string} msg - The message to display.
 * @param {string} [def] - The default value for the input field.
 * @param {ModalOptions} [options] - Configuration options for the prompt.
 * @returns {Promise<string|null>}
 */
export const prompt = (msg, def, options) => BootstrapDialogs.prompt(msg, def, options);

/**
 * @param {string} msg - The message to display.
 * @param {ModalOptions} [options] - Configuration options for the confirmation.
 * @returns {Promise<boolean>}
 */
export const confirm = (msg, options) => BootstrapDialogs.confirm(msg, options);

/**
 * @param {string} msg - The message to display.
 * @returns {void}
 */
export const showLoading = (msg) => BootstrapDialogs.showLoading(msg);

/**
 * Hides and destroys the active loading overlay.
 * @returns {void}
 */
export const hideLoading = () => BootstrapDialogs.hideLoading();

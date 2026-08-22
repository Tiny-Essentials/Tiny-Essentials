import { Modal } from 'bootstrap/dist/js/bootstrap.bundle.min.js';

/**
 * @typedef {Object} ModalOptions
 * @property {string} [title]
 * @property {string} [confirmText]
 * @property {string} [cancelText]
 * @property {string} [defaultValue]
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

  /**
   * Helper to forcefully clean up body styles injected by Bootstrap JS.
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
   * @param {string} message
   * @param {ModalOptions} [options]
   * @returns {Promise<void>}
   */
  static async alert(message, options = {}) {
    /** @type {string} */
    const title = options.title || 'Alert';
    /** @type {string} */
    const confirmText = options.confirmText || 'OK';
    await this._show(title, message, false, confirmText, null, 'alert');
  }

  /**
   * @param {string} message
   * @param {ModalOptions} [options]
   * @returns {Promise<boolean>}
   */
  static async confirm(message, options = {}) {
    /** @type {string} */
    const title = options.title || 'Confirm';
    /** @type {string} */
    const confirmText = options.confirmText || 'Yes';
    /** @type {string} */
    const cancelText = options.cancelText || 'No';
    return await this._show(title, message, true, confirmText, cancelText, 'confirm');
  }

  /**
   * @param {string} message
   * @param {string} [defaultValue='']
   * @param {ModalOptions} [options]
   * @returns {Promise<string|null>}
   */
  static async prompt(message, defaultValue = '', options = {}) {
    /** @type {string} */
    const title = options.title || 'Prompt';
    /** @type {string} */
    const confirmText = options.confirmText || 'Submit';
    /** @type {string} */
    const cancelText = options.cancelText || 'Cancel';

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

    return await this._show(title, bodyContainer, true, confirmText, cancelText, 'prompt');
  }

  /**
   * Displays a global, non-dismissible loading overlay for background/DB tasks.
   * @param {string} [message='Processing...'] - The message to display while loading.
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
    this._loadingInstance = new Modal(modal, { backdrop: 'static', keyboard: false });
    this._loadingInstance.show();
  }

  /**
   * Hides and destroys the active loading overlay.
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
   * @param {string} titleText
   * @param {HTMLElement|string} bodyContent - Either a text string or a DOM Node.
   * @param {boolean} showCancel
   * @param {string} confirmText
   * @param {string} [cancelText='Cancel']
   * @returns {HTMLElement} The constructed modal element.
   */
  static _buildModalElement(
    titleText,
    bodyContent,
    showCancel,
    confirmText,
    cancelText = 'Cancel',
  ) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.zIndex = '1065';

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog modal-dialog-centered';

    const content = document.createElement('div');
    content.className = 'modal-content shadow-lg border-0';

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header bg-body-tertiary';

    const title = document.createElement('h5');
    title.className = 'modal-title fw-bold';
    title.textContent = titleText;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('data-bs-dismiss', 'modal');
    closeBtn.setAttribute('aria-label', 'Close');

    header.append(title, closeBtn);

    // Body
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.style.whiteSpace = 'pre-wrap';

    if (bodyContent instanceof Node) {
      body.appendChild(bodyContent);
    } else {
      body.textContent = bodyContent;
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer border-top-0 pt-0';

    if (showCancel) {
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-secondary';
      cancelBtn.setAttribute('data-bs-dismiss', 'modal');
      cancelBtn.textContent = cancelText;
      footer.appendChild(cancelBtn);
    }

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'btn btn-primary fw-bold px-4';
    confirmBtn.id = 'bs-modal-confirm';
    confirmBtn.textContent = confirmText;
    footer.appendChild(confirmBtn);

    content.append(header, body, footer);
    dialog.appendChild(content);
    modal.appendChild(dialog);

    return modal;
  }

  /**
   * Clean up any existing modal and resolve its promise.
   */
  static _cleanup() {
    if (this._activeResolve) {
      /** @type {any} */
      let cancelValue;
      if (this._activeType === 'prompt') cancelValue = null;
      else if (this._activeType === 'confirm') cancelValue = false;

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
   * @param {string} title
   * @param {HTMLElement|string} bodyContent
   * @param {boolean} showCancel
   * @param {string} confirmText
   * @param {string} [cancelText='Cancel']
   * @param {'alert'|'confirm'|'prompt'} type
   * @returns {Promise<any>}
   */
  static _show(title, bodyContent, showCancel, confirmText, cancelText, type) {
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
      );
      this._modalElement = modalElement;
      document.body.appendChild(modalElement);

      const confirmBtn = modalElement.querySelector('#bs-modal-confirm');
      const inputField = modalElement.querySelector('#bs-prompt-input');

      if (!confirmBtn) {
        throw new Error('Critical Error: Confirm button not found in modal template.');
      }

      this._activeInstance = new Modal(modalElement);
      /** @type {boolean} */
      let isConfirmed = false;

      /**
       * Handles the confirmation action.
       */
      const handleConfirm = () => {
        isConfirmed = true;
        /** @type {any} */
        let value;
        if (type === 'prompt') value = inputField?.value;
        else if (type === 'confirm') value = true;
        else value = true; // For alerts

        this._activeInstance.hide();
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
 * @param {ModalOptions} [options] - Optional configuration for title and buttons.
 * @returns {Promise<void>}
 */
export const alert = (msg, options) => BootstrapDialogs.alert(msg, options);

/**
 * @param {string} msg - The message to display.
 * @param {string} [def] - The default value for the input field.
 * @param {ModalOptions} [options] - Optional configuration for title and buttons.
 * @returns {Promise<string|null>}
 */
export const prompt = (msg, def, options) => BootstrapDialogs.prompt(msg, def, options);

/**
 * @param {string} msg - The message to display.
 * @param {ModalOptions} [options] - Optional configuration for title and buttons.
 * @returns {Promise<boolean>}
 */
export const confirm = (msg, options) => BootstrapDialogs.confirm(msg, options);

/**
 * @param {string} msg - The message to display.
 */
export const showLoading = (msg) => BootstrapDialogs.showLoading(msg);

export const hideLoading = () => BootstrapDialogs.hideLoading();

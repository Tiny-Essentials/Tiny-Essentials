import { Modal } from 'bootstrap/dist/js/bootstrap.bundle.min.js';

/**
 * @typedef {Object} ModalOptions
 * @property {string} [title]
 * @property {string} [confirmText]
 * @property {string} [cancelText]
 * @property {string} [defaultValue]
 */

/**
 * @typedef {Object} ModalOptions
 * @property {string} [title]
 * @property {string} [confirmText]
 * @property {string} [cancelText]
 * @property {string} [defaultValue]
 */

/**
 * Utility to replace native alert/confirm/prompt with Bootstrap 5 modals.
 */
class BootstrapDialogs {
  /** @type {Modal|null} */
  static _activeInstance = null;
  /** @type {Modal|null} */
  static _loadingInstance = null;
  /** @type {Function|null} */
  static _activeResolve = null;
  /** @type {'alert'|'confirm'|'prompt'|null} */
  static _activeType = null;

  /**
   * Helper to forcefully clean up body styles injected by Bootstrap JS.
   * This is necessary because React modals in this app don't use Bootstrap JS,
   * so Bootstrap gets confused when it detects them and leaves the body locked.
   */
  static _restoreBody() {
    const hasDialog = document.getElementById('bs-custom-modal');
    const hasLoading = document.getElementById('bs-loading-modal');

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

    const html = this._createTemplate(title, message, false, confirmText);
    await this._show(html, 'alert');
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

    const html = this._createTemplate(title, message, true, confirmText, cancelText);
    return await this._show(html, 'confirm');
  }

  /**
   * @param {string} message
   * @param {string} [defaultValue]
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

    const inputHtml = `<input type="text" class="form-control mt-2" id="bs-prompt-input" value="${defaultValue}">`;
    const bodyContent = `${message}${inputHtml}`;

    const html = this._createTemplate(title, bodyContent, true, confirmText, cancelText);
    return await this._show(html, 'prompt');
  }

  /**
   * Displays a global, non-dismissible loading overlay for background/DB tasks.
   * @param {string} [message='Processing...'] - The message to display while loading.
   */
  static showLoading(message = 'Processing...') {
    if (this._loadingInstance) return; // Prevent multiple loading overlays

    const html = `
      <div class="modal fade" id="bs-loading-modal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true" style="z-index: 1070;">
          <div class="modal-dialog modal-dialog-centered modal-sm">
              <div class="modal-content bg-transparent border-0 shadow-none">
                  <div class="modal-body text-center d-flex flex-column align-items-center justify-content-center">
                      <div class="spinner-border text-primary shadow-sm mb-3" role="status" style="width: 4rem; height: 4rem;"></div>
                      <h5 class="fw-bold text-white shadow-sm px-4 py-2 rounded bg-dark bg-opacity-75">${message}</h5>
                  </div>
              </div>
          </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    const element = document.getElementById('bs-loading-modal');
    this._loadingInstance = new Modal(element, { backdrop: 'static', keyboard: false });
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

    const element = document.getElementById('bs-loading-modal');
    if (element) element.remove();

    this._restoreBody();
  }

  /**
   * @param {string} title
   * @param {string} body
   * @param {boolean} showCancel
   * @param {string} confirmText
   * @param {string} [cancelText]
   * @returns {string}
   */
  static _createTemplate(title, body, showCancel, confirmText, cancelText = 'Cancel') {
    /** @type {string} */
    const cancelBtn = showCancel
      ? `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>`
      : '';

    return `
            <div class="modal fade" id="bs-custom-modal" tabindex="-1" aria-hidden="true" style="z-index: 1065;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content shadow-lg border-0">
                        <div class="modal-header bg-body-tertiary">
                            <h5 class="modal-title fw-bold">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" style="white-space: pre-wrap;">${body}</div>
                        <div class="modal-footer border-top-0 pt-0">
                            ${cancelBtn}
                            <button type="button" class="btn btn-primary fw-bold px-4" id="bs-modal-confirm">${confirmText}</button>
                        </div>
                    </div>
                </div>
            </div>`;
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

    /** @type {HTMLElement|null} */
    const element = document.getElementById('bs-custom-modal');
    if (element) element.remove();

    this._restoreBody();
  }

  /**
   * @param {string} html
   * @param {'alert'|'confirm'|'prompt'} type
   * @returns {Promise<any>}
   */
  static _show(html, type) {
    this._cleanup();

    return new Promise((resolve) => {
      this._activeResolve = resolve;
      this._activeType = type;

      document.body.insertAdjacentHTML('beforeend', html);

      /** @type {HTMLElement} */
      const modalElement = document.getElementById('bs-custom-modal');
      /** @type {HTMLElement} */
      const confirmBtn = document.getElementById('bs-modal-confirm');
      /** @type {HTMLInputElement|null} */
      const inputField = document.getElementById('bs-prompt-input');

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
        if (type === 'prompt') value = inputField.value;
        else if (type === 'confirm') value = true;

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

/** */
export const hideLoading = () => BootstrapDialogs.hideLoading();

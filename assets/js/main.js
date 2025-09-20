/**
 * Returns back a NodeList of focusable elements
 * that exist within the passed parent HTMLElement
 *
 * @param {HTMLElement} parent HTML element
 * @returns {NodeList} The focusable elements that we can find
 */
function getFocusableElements(parent) {
  if (!parent) {
    console.warn("You need to pass a parent HTMLElement");
    return [];
  }

  return parent.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), details:not([disabled]), summary:not(:disabled)',
  );
}

/**
 * BurgerMenu
 */
class BurgerMenu extends HTMLElement {
  constructor() {
    super();

    const self = this;

    this.state = new Proxy(
      {
        status: "open",
        enabled: false,
      },
      {
        set(state, key, value) {
          const oldValue = state[key];

          state[key] = value;
          if (oldValue !== value) {
            self.processStateChange();
          }
          return state;
        },
      },
    );
  }

  get maxWidth() {
    return Number.parseInt(this.getAttribute("max-width") || 9999, 10);
  }

  connectedCallback() {
    this.initialMarkup = this.innerHTML;
    this.render();

    const observer = new ResizeObserver((observedItems) => {
      const { contentRect } = observedItems[0];
      this.state.enabled = contentRect.width <= this.maxWidth;
    });

    // Watch the parent
    observer.observe(this.parentNode);
  }

  render() {
    this.innerHTML = `
			<div class="burger-menu" data-element="burger-root">
				<button class="burger-menu-trigger" data-element="burger-menu-trigger" type="button" aria-label="Open menu">
					<span class="burger-menu-bar" aria-hidden="true"></span>
				</button>
				<div class="burger-menu-panel" data-element="burger-menu-panel">
					${this.initialMarkup}
				</div>
			</div>
		`;

    this.postRender();
  }

  postRender() {
    this.trigger = this.querySelector('[data-element="burger-menu-trigger"]');
    this.panel = this.querySelector('[data-element="burger-menu-panel"]');
    this.root = this.querySelector('[data-element="burger-root"]');
    this.focusableElements = getFocusableElements(this);

    if (this.trigger && this.panel) {
      this.toggle();

      this.trigger.addEventListener("click", (event_) => {
        event_.preventDefault();

        this.toggle();
      });

      document.addEventListener("focusin", () => {
        if (!this.contains(document.activeElement)) {
          this.toggle("closed");
        }
      });

      return;
    }

    this.innerHTML = this.initialMarkup;
  }

  toggle(forcedStatus) {
    if (forcedStatus) {
      if (this.state.status === forcedStatus) {
        return;
      }

      this.state.status = forcedStatus;
    } else {
      this.state.status = this.state.status === "closed" ? "open" : "closed";
    }
  }

  processStateChange() {
    this.root.setAttribute("status", this.state.status);
    this.root.setAttribute("enabled", this.state.enabled ? "true" : "false");

    this.manageFocus();

    switch (this.state.status) {
      case "closed": {
        this.trigger.setAttribute("aria-expanded", "false");
        this.trigger.setAttribute("aria-label", "Open menu");
        break;
      }
      case "open":
      case "initial": {
        this.trigger.setAttribute("aria-expanded", "true");
        this.trigger.setAttribute("aria-label", "Close menu");
        break;
      }
      default: {
        console.log("Error Process State Change");
      }
    }
  }

  manageFocus() {
    if (!this.state.enabled) {
      for (const element of this.focusableElements)
        element.removeAttribute("tabindex");
      return;
    }

    switch (this.state.status) {
      case "open": {
        for (const element of this.focusableElements)
          element.removeAttribute("tabindex");
        break;
      }
      case "closed": {
        for (const element of [...this.focusableElements].filter(
          (element) => element.dataset.element !== "burger-menu-trigger",
        ))
          element.setAttribute("tabindex", "-1");
        break;
      }
      default: {
        console.log("Error Manage Focus");
      }
    }
  }
}

if ("customElements" in window) {
  customElements.define("burger-menu", BurgerMenu);
}

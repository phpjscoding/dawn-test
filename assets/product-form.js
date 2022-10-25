if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector("form");
        this.form.querySelector("[name=id]").disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart =
          document.querySelector("cart-notification") ||
          document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        if (document.querySelector("cart-drawer"))
          this.submitButton.setAttribute("aria-haspopup", "dialog");
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute("aria-disabled") === "true") return;

        this.handleErrorMessage();

        this.submitButton.setAttribute("aria-disabled", true);
        this.submitButton.classList.add("loading");
        this.querySelector(".loading-overlay__spinner").classList.remove(
          "hidden"
        );

        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            "sections",
            this.cart.getSectionsToRender().map((section) => section.id)
          );

          formData.append("sections_url", window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;
        fetch(`${routes.cart_add_url}`, config)
          .then((response) => {
            return response.json();
          })
          .then((response) => {
            if (response.status) {
              this.handleErrorMessage(response.description);

              const soldOutMessage =
                this.submitButton.querySelector(".sold-out-message");
              if (!soldOutMessage) return;
              this.submitButton.setAttribute("aria-disabled", true);
              this.submitButton.querySelector("span").classList.add("hidden");
              soldOutMessage.classList.remove("hidden");
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;

              return;
            }

            this.error = false;
            const quickAddModal = this.closest("quick-add-modal");
            if (quickAddModal) {
              document.body.addEventListener(
                "modalClosed",
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
              // verify if selected variant is "Handbag black / medium"
              let v_selected_title = `${response.product_title} ${response.variant_title}`;
              if (v_selected_title == "Handbag black / medium") {
                //define product object available for bundle product default variantid : 43652394778910
                let bundle_item = {
                  "items": [{
                    "id": 43652394778910,
                    "quantity": 1
                    }] 

                };
                // if we have a match for the targeted variant,dispatch an event so we can listen to it in different context
                const x_event = new CustomEvent("has_bundle", {
                  detail: bundle_item,
                });
                document.dispatchEvent(x_event);
              }
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove("loading");
            if (this.cart && this.cart.classList.contains("is-empty"))
              this.cart.classList.remove("is-empty");
            if (!this.error) this.submitButton.removeAttribute("aria-disabled");
            this.querySelector(".loading-overlay__spinner").classList.add(
              "hidden"
            );
          });

        // <> code to handle product with bundle
        // listen for dispatched event 'has_bundle'
        //  automaticlly add Soft Winter Jacket
        // increment price with 0.01$
        // when “Handbag is removed remove 'Soft Winter Jacket' as well

        class GoesInBundleItem extends HTMLElement {
          constructor() {
            super();

            this.div = document.createElement("div");
            this.div.classList.add("x-span-1");
            this.div.innerHTML = `<div id="cart-notification-product" class="cart-notification-product">
            <div class="cart-notification-product__image global-media-settings">
            <img src="//cdn.shopify.com/s/files/1/0670/2415/9006/products/smiling-woman-on-snowy-afternoon_925x_9a33bd14-6ee0-4987-88d6-5691caf3b58a.jpg?v=1666283730&amp;width=140" class="cart-item__image" alt="" loading="lazy" width="70" height="95">
  </div><div><h3 class="cart-notification-product__name h4">Soft Winter Jacket</h3>
  
        </div>
</div>`;
            this.appendChild(this.div);
          }
        }

        customElements.define("goes-in-bundle-item", GoesInBundleItem);
        let target = document.querySelector(".product__title");
        document.addEventListener("has_bundle", (e) => {
          console.log(e.detail);
          document
            .querySelector(".cart-notification-product")
            .after(new GoesInBundleItem());

            fetch(window.Shopify.routes.root + 'cart/add.js', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(e.detail)
            })
            .then(x_response => {
              this.cart.renderContents(x_response);
               console.log(x_response.json());
            })
            .catch((error) => {
              console.error('Error:', error);
            });
        
         
        });
        //</>
      }

      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector(".product-form__error-message-wrapper");
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            ".product-form__error-message"
          );

        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    }
  );
}

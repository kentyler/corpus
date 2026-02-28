(ns app.transforms.ui
  "Pure UI transforms — (state, args) -> state.
   3 transforms for loading, error, and page navigation.")

(defn set-loading [state loading?]
  (assoc state :loading? loading?))

(defn set-error [state message]
  (assoc state :error message))

(defn clear-error [state]
  (assoc state :error nil))

(defn set-page [state page]
  (assoc state :current-page page))

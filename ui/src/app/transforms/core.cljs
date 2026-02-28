(ns app.transforms.core
  "Transform registry and dispatch — pure state transforms only.
   Each transform is (state, ...args) -> state."
  (:require [app.state :refer [app-state]]
            [app.transforms.notes :as notes]
            [app.transforms.ui :as ui]))

;; ============================================================
;; REGISTRY — keyword -> transform function
;; ============================================================

(def registry
  {;; Notes (8)
   :set-notes-entries     notes/set-notes-entries
   :add-notes-entry       notes/add-notes-entry
   :set-notes-selected    notes/set-notes-selected
   :set-notes-input       notes/set-notes-input
   :set-notes-loading     notes/set-notes-loading
   :set-notes-read-entry  notes/set-notes-read-entry
   :append-notes-response notes/append-notes-response
   :set-notes-regenerating notes/set-notes-regenerating

   ;; UI (4)
   :set-loading  ui/set-loading
   :set-error    ui/set-error
   :clear-error  ui/clear-error
   :set-page     ui/set-page})

;; ============================================================
;; DISPATCH
;; ============================================================

(defn dispatch!
  "Apply a named transform to app-state.
   (dispatch! :set-loading true)
   (dispatch! :set-notes-read-entry entry responses)"
  [transform-name & args]
  (if-let [transform-fn (get registry transform-name)]
    (swap! app-state #(apply transform-fn % args))
    (js/console.warn "Unknown transform:" (str transform-name))))

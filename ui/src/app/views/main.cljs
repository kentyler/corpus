(ns app.views.main
  "Main application view — simple router between Notes and LLM Registry."
  (:require [app.state :as state]
            [app.transforms.core :as t]
            [app.views.notes :as notes]
            [app.views.llm-registry :as llm-registry]))

(defn- error-banner []
  (when-let [error (:error @state/app-state)]
    [:div.error-banner
     [:span error]
     [:button {:on-click #(t/dispatch! :clear-error)} "Dismiss"]]))

(defn app []
  (let [page (:current-page @state/app-state)]
    [:div.corpus-app
     [error-banner]
     (case page
       :notes        [notes/notes-page]
       :llm-registry [llm-registry/llm-registry-page]
       ;; Default to notes
       [notes/notes-page])]))

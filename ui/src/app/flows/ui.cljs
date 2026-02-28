(ns app.flows.ui
  "UI flows — config loading/saving."
  (:require [app.state :as state :refer [app-state api-base]]
            [app.effects.http :as http]
            [app.transforms.core :as t]
            [cljs.core.async :refer [go <!]]))

(def load-config-flow
  "GET /api/config → update :config in state"
  [{:step :do
    :fn (fn [ctx]
          (go
            (let [response (<! (http/get! (str api-base "/api/config")))]
              (when (:ok? response)
                (swap! app-state assoc :config (:data response))))
            ctx))}])

(def save-config-flow
  "PUT /api/config — save current :config to settings/config.json"
  [{:step :do
    :fn (fn [ctx]
          (go
            (let [config (:config @app-state)
                  response (<! (http/put! (str api-base "/api/config")
                                          :json-params config))]
              (when-not (:ok? response)
                (t/dispatch! :set-error "Failed to save configuration")))
            ctx))}])

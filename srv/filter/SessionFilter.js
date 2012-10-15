define(['srv/core/Filter', 'require', 'flow', 'js/data/DataSource', 'srv/core/ServerSession'], function (Filter, require, flow, DataSource, ServerSession) {


    return Filter.inherit('srv.filter.SessionFilter', {

        // TODO: add default dataSource
        $dataSource: null,

        $activeSessions: 0,

        defaults: {
            sessionName: "sessionId",
            sessionId: null,
            timeout: 120 // in minutes
        },

        _start: function (callback) {
            if (this.$dataSource) {
                callback();
            } else {
                callback("No dataSource for SessionFilter defined.");
            }
        },

        addChild: function (child) {
            if (child instanceof DataSource) {
                this.$dataSource = child;
            }
            this.callBase();
        },

        beginRequest: function (context, callback) {
            var sessionName = this.$.sessionName,
                sessionId = context.request.cookies[sessionName],
                session = context.session,
                dataSourceContext;

            // set session id if available
            sessionId && session.set("id", sessionId);
            session.$sessionFilter = this;

            // TODO: determinate correct context from data source
            dataSourceContext = this.$dataSource.getContext();
            dataSourceContext.addEntity(session);

            callback();

        },

        generateSessionId: function () {
            var d = new Date().getTime();
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });
        },


        beforeHeadersSend: function (context, callback) {
            var session = context.session,
                sessionName = this.$.sessionName,
                sessionId = session.$.id;

            if (session.$started && context.request.cookies[sessionName] !== sessionId) {
                // store session id in cookie
                context.response.cookies.set(sessionName, sessionId);
            }

            callback();
        },

        endRequest: function (context, callback) {

            // on end, save the session yeah!
            var session = context.session;

            session.set('expires', this._getExpiresDate());
            session.save({
                id: session.$.id
            }, function () {
                // TODO: do we need to destroy the session here, why. No extra code I see?
                context.session.destroy();
                callback();
            });

        },

        _getExpiresDate: function () {
            var date = new Date();
            date.setTime(date.getTime() + this.$.timeout * 1000);
            return date;
        }


    })
});
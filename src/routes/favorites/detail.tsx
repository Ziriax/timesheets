import { transaction } from 'mobx';
import { Route, RoutesConfig } from 'mobx-router';
import * as React from 'react';

import { IRootStore } from '../../stores/root-store';
import { IViewAction } from '../../stores/view-store';
import { goToFavorites } from './list';
import { setTitleForRoute } from '../actions';
import { App } from '../../internal';
import FavoriteGroupDetailPage from '../../pages/favorite-group-detail';

const path = "/favoritedetail";

export const goToFavorite = (store: IRootStore, id: string) => {
    store.router.goTo(routes.favoriteDetail, { id }, store);
};

const beforeEnter = (_route: Route, params: { id?: string }, s: IRootStore) => {
    if (params.id) {
        s.favorites.setActiveFavoriteGroupId(params.id);
    }
    else {
        throw new Error("favorite id is missing in querystring");
    }
}

const onEnter = (route: Route, _params: any, s: IRootStore) => {
    const save = () => {
        s.favorites.updateActiveFavoriteGroup();
    };
    const deleteAction: IViewAction = {
        action: () => {
            s.favorites.deleteActiveFavoriteGroup();
            goToFavorites(s);
        },
        icon: { label: "Delete", content: "delete" },
        shortKey: { key: "Delete", ctrlKey: true }
    }

    const saveAction: IViewAction = {
        action: () => {
            save();
            goToFavorites(s);
        },
        icon: { label: "Save", content: "save" },
        shortKey: { key: "s", ctrlKey: true }
    }

    transaction(() => {
        s.view.setActions([
            saveAction,
            deleteAction
        ]);

        s.view.setNavigation({
            action: () => {
                save();
                goToFavorites(s);
            },
            icon: { label: "Back", content: "arrow_back" }
        });

        setTitleForRoute(s, route);
    });
};

const beforeExit = (_route: Route, _params: any, s: IRootStore) => {
    transaction(() => {
        s.favorites.setActiveFavoriteGroupId(undefined);
        s.view.setNavigation("default");
        s.view.setActions([]);
    });
};

const routes = {
    favoriteDetail: new Route({
        path: path + '/:id',
        component: <App><FavoriteGroupDetailPage /></App>,
        title: "Edit favorite group",
        onEnter,
        beforeExit,
        beforeEnter,
    })
} as RoutesConfig;

export default routes;

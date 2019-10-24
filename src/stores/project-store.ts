import { computed, IObservableArray, action, observable, transaction } from 'mobx';
import { Collection, ICollection } from "firestorable";
import { IRootStore } from './root-store';
import { firestore } from '../firebase/my-firebase';
import { IProject, IProjectData } from '../../common/dist';

import * as serializer from '../../common/serialization/serializer';
import * as deserializer from '../../common/serialization/deserializer';

export interface IProjectStore {
    activeProjects: IObservableArray<IProject & { id: string }>;
    archivedProjects: IObservableArray<IProject & { id: string }>;

    projectsCollection: ICollection<IProject, IProjectData>;

    setDefaultProject: (project?: Partial<IProject>) => void;
    addProject: (project: IProject, id?: string) => void;
    updateProject: (project: Partial<IProject>, id: string) => void;
    archiveProjects: (...projectIds: string[]) => void;
    unarchiveProjects: (...projectIds: string[]) => void;
    deleteProjects: (...ids: string[]) => void;

    setProjectId: (id?: string) => void;

    readonly project?: Partial<IProject> | null;
    projectId?: string;
}

export class ProjectStore implements IProjectStore {
    private readonly rootStore: IRootStore;
    private _project = observable.box<Partial<IProject> | undefined>();

    readonly projectsCollection: ICollection<IProject, IProjectData>;

    // public project: IObservableValue<(IProject & { id: string }) | undefined>;
    @observable.ref projectId?: string;

    constructor(rootStore: IRootStore) {
        this.rootStore = rootStore;
        this.projectsCollection = observable(new Collection<IProject, IProjectData>(firestore, rootStore.getCollection.bind(this, "projects"), {
            realtime: true,
            query: ref => ref.orderBy("name_insensitive"),
            serialize: serializer.convertProject,
            deserialize: deserializer.convertProject,
        }));
    }

    public archiveProjects(...projectIds: string[]) {
        projectIds.length && this.projectsCollection.updateAsync({ isArchived: true }, ...projectIds)
            .then(() => {
                this.setProjectId(undefined);
            });
    }

    public unarchiveProjects(...projectIds: string[]) {
        projectIds.length && this.projectsCollection.updateAsync({ isArchived: false }, ...projectIds)
            .then(() => {
                this.setProjectId(undefined);
            });
    }

    public deleteProjects(...ids: string[]) {
        ids.length && this.projectsCollection.updateAsync("delete", ...ids);
    }

    public addProject(project: IProject, id?: string) {
        if (!project.createdBy) {
            throw new Error("The current authenticed user must be set on project when adding a new project.");
        }

        this.projectsCollection.addAsync(project, id);
    }

    public updateProject(project: Partial<IProject>, id: string) {
        this.projectsCollection.updateAsync(project, id);
    }

    @action
    public setProjectId(id?: string) {
        this.projectId = id;
    }

    @action
    public setDefaultProject(project?: Partial<IProject>) {
        const defaultProject: Partial<IProject> = {
            createdBy: this.rootStore.user.userId,
        };

        transaction(() => {
            this._project.set({...defaultProject, ...project});
            this.projectId = undefined;
        })
    }

    @computed
    public get project() {
        const projectId = this.projectId;
        if (projectId) {
            const doc = this.projectsCollection.docs.get(projectId);
            return doc ? doc.data : undefined;
        } else {
            return this._project.get();
        }
    }

    @computed
    public get activeProjects() {
        return observable(Array.from(this.projectsCollection.docs.values())
            .map(doc => ({ ...doc.data!, id: doc.id }))
            .filter(p => !p.isArchived && !p.deleted));
    }

    @computed
    public get archivedProjects() {
        return observable(Array.from(this.projectsCollection.docs.values())
            .map(doc => ({ ...doc.data!, id: doc.id }))
            .filter(p => p.isArchived && !p.deleted));
    }
}
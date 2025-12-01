import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ResumeFile } from '../../../models/common/resume-file.model';
import { SharedService } from '../../../services/shared.service';
import { BaseComponent } from '../../base/base.component';

@Component({
    selector: 'app-file-type',
    templateUrl: './file-type.component.html',
    standalone: true,
    imports: [CommonModule],
})

export class FileTypeComponent extends BaseComponent implements OnInit {
    private activatedroute = inject(ActivatedRoute);
    private sharedService = inject(SharedService);

    @Input() fileTabId!: string;
    @Input() type!: number;
    @Input() listInputFiles: ResumeFile[] = [];
    listPropertyFiles: ResumeFile[] = [];

    private subscription!: Subscription;

    override  ngOnInit() {
        super.ngOnInit();
        if (this.type == 1) {
            this.subscription = this.sharedService.listEdificationFiles$
                .subscribe(files => {
                    this.listInputFiles = files;
                    this.setListPropertyFiles();
                });
        } else if (this.type == 3) {
            this.subscription = this.sharedService.listTerrainFiles$
                .subscribe(files => {
                    this.listInputFiles = files;
                    this.setListPropertyFiles();
                });
        } else if (this.type == 2) {
            this.subscription = this.sharedService.listResidenceFiles$
                .subscribe(files => {
                    this.listInputFiles = files;
                    this.setListPropertyFiles();
                });
        } else if (this.type == 4) {
            this.subscription = this.sharedService.listVehicleFiles$
                .subscribe(files => {
                    this.listInputFiles = files;
                    this.setListPropertyFiles();
                });
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['fileTabId']) {
            this.setListPropertyFiles();
        }
    }

    setListPropertyFiles() {
        this.listPropertyFiles = [];
        this.listInputFiles?.forEach(fileType => {
            if (fileType.fileTabId == this.fileTabId) {
                this.listPropertyFiles.push(fileType);
            }
        });
    }

    details(fileTypeId: string) {
        if (fileTypeId) {
            this.router.navigate([fileTypeId], {
                relativeTo: this.activatedroute,
                queryParamsHandling: 'preserve'
            });
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

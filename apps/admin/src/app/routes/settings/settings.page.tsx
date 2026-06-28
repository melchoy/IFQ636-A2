import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from "@otbt/ui";

import { SettingsForm } from "../../../modules/settings";

export function SettingsPage() {
  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Storefront</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Configure order references and customer product browsing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline">
            Reset changes
          </Button>
          <Button type="button">Save settings</Button>
        </div>
      </div>

      <SettingsForm />
    </section>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { addPasskey } from "@/components/passkeys/add-passkey";
import { PasskeyList } from "@/components/passkeys/passkey-list";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { Separator } from "@/lib/components/separator";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/lib/components/tabs";

export const Route = createFileRoute("/dashboard/_layout/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">Settings</h2>
				</div>
				<Tabs defaultValue="account" className="space-y-4">
					<TabsList>
						<TabsTrigger value="account">Account</TabsTrigger>
						<TabsTrigger value="security">Security</TabsTrigger>
						<TabsTrigger value="advanced">Advanced</TabsTrigger>
					</TabsList>
					<TabsContent value="account" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Account Information</CardTitle>
								<CardDescription>Update your account details</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Name</Label>
									<Input id="name" defaultValue="Admin User" />
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input id="email" defaultValue="admin@example.com" />
								</div>
							</CardContent>
							<CardFooter className="flex justify-between">
								<Button variant="outline">Cancel</Button>
								<Button>Save Changes</Button>
							</CardFooter>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Delete Account</CardTitle>
								<CardDescription>
									Permanently delete your account and all associated data
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground text-sm">
									This action is irreversible. All your data, including API
									keys, usage history, and provider connections will be
									permanently deleted.
								</p>
							</CardContent>
							<CardFooter>
								<Button variant="destructive">Delete Account</Button>
							</CardFooter>
						</Card>
					</TabsContent>
					<TabsContent value="security" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Change Password</CardTitle>
								<CardDescription>Update your password</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="current-password">Current Password</Label>
									<Input id="current-password" type="password" />
								</div>
								<Separator />
								<div className="space-y-2">
									<Label htmlFor="new-password">New Password</Label>
									<Input id="new-password" type="password" />
								</div>
								<div className="space-y-2">
									<Label htmlFor="confirm-password">Confirm New Password</Label>
									<Input id="confirm-password" type="password" />
								</div>
							</CardContent>
							<CardFooter>
								<Button>Update Password</Button>
							</CardFooter>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Passkeys</CardTitle>
								<CardDescription>
									Manage your passkeys for passwordless login
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<PasskeyList />
							</CardContent>
							<CardFooter>
								<Button onClick={() => addPasskey()}>Add Passkey</Button>
							</CardFooter>
						</Card>
					</TabsContent>
					<TabsContent value="advanced" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Advanced Settings</CardTitle>
								<CardDescription>
									Configure advanced system settings
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground text-sm">
									Advanced settings are available in the configuration file.
								</p>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

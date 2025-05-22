import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { PaymentMethodsManagement } from "@/components/credits/payment-methods-management";
import { addPasskey } from "@/components/passkeys/add-passkey";
import { PasskeyList } from "@/components/passkeys/passkey-list";
import { CachingSettings } from "@/components/settings/caching-settings";
import {
	useDeleteAccount,
	useUpdatePassword,
	useUpdateUser,
} from "@/hooks/useUser";
import { useSession } from "@/lib/auth-client";
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
import { toast } from "@/lib/components/use-toast";

export const Route = createFileRoute("/dashboard/_layout/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const { data: session } = useSession();
	const user = session?.user;

	const [name, setName] = useState(user?.name || "");
	const [email, setEmail] = useState(user?.email || "");

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const updateUserMutation = useUpdateUser();
	const updatePasswordMutation = useUpdatePassword();
	const deleteAccountMutation = useDeleteAccount();
	const navigate = useNavigate();

	const handleUpdateUser = async () => {
		try {
			await updateUserMutation.mutateAsync({
				name: name || undefined,
				email: email || undefined,
			});

			toast({
				title: "Success",
				description: "Your account information has been updated.",
			});
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "An error occurred",
				variant: "destructive",
			});
		}
	};

	const handleUpdatePassword = async () => {
		if (newPassword !== confirmPassword) {
			toast({
				title: "Error",
				description: "New passwords do not match",
				variant: "destructive",
			});
			return;
		}

		try {
			await updatePasswordMutation.mutateAsync({
				currentPassword,
				newPassword,
			});

			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");

			toast({
				title: "Success",
				description: "Your password has been updated.",
			});
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "An error occurred",
				variant: "destructive",
			});
		}
	};

	const handleDeleteAccount = async () => {
		const confirmed = window.confirm(
			"Are you sure you want to delete your account? This action cannot be undone.",
		);

		if (!confirmed) {
			return;
		}

		try {
			await deleteAccountMutation.mutateAsync();

			navigate({ to: "/login" });

			toast({
				title: "Account Deleted",
				description: "Your account has been successfully deleted.",
			});
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "An error occurred",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">Settings</h2>
				</div>
				<Tabs defaultValue="preferences" className="space-y-4">
					<TabsList>
						<TabsTrigger value="preferences">Preferences</TabsTrigger>
						<TabsTrigger value="account">Account</TabsTrigger>
						<TabsTrigger value="security">Security</TabsTrigger>
						<TabsTrigger value="payment">Payment</TabsTrigger>
						<TabsTrigger value="advanced">Advanced</TabsTrigger>
					</TabsList>
					<TabsContent value="preferences" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Preferences</CardTitle>
								<CardDescription>
									Configure application preferences
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<CachingSettings />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="account" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Account Information</CardTitle>
								<CardDescription>Update your account details</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										value={name}
										onChange={(e) => setName(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
									/>
								</div>
							</CardContent>
							<CardFooter className="flex justify-between">
								<Button variant="outline">Cancel</Button>
								<Button
									onClick={handleUpdateUser}
									disabled={updateUserMutation.isPending}
								>
									{updateUserMutation.isPending ? "Saving..." : "Save Changes"}
								</Button>
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
								<Button
									variant="destructive"
									onClick={handleDeleteAccount}
									disabled={deleteAccountMutation.isPending}
								>
									{deleteAccountMutation.isPending
										? "Deleting..."
										: "Delete Account"}
								</Button>
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
									<Input
										id="current-password"
										type="password"
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
									/>
								</div>
								<Separator />
								<div className="space-y-2">
									<Label htmlFor="new-password">New Password</Label>
									<Input
										id="new-password"
										type="password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="confirm-password">Confirm New Password</Label>
									<Input
										id="confirm-password"
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
									/>
								</div>
							</CardContent>
							<CardFooter>
								<Button
									onClick={handleUpdatePassword}
									disabled={updatePasswordMutation.isPending}
								>
									{updatePasswordMutation.isPending
										? "Updating..."
										: "Update Password"}
								</Button>
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
								<Button
									onClick={async () => {
										await addPasskey(queryClient);
									}}
								>
									Add Passkey
								</Button>
							</CardFooter>
						</Card>
					</TabsContent>
					<TabsContent value="payment" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Payment Methods</CardTitle>
								<CardDescription>
									Manage your payment methods for topping up credits
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<PaymentMethodsManagement />
							</CardContent>
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
							<CardContent className="space-y-6">
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

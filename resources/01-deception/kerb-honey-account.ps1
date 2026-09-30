Import-Module ActiveDirectory
New-ADUser -Name "ServiceName" -SamAccountName "ServiceName" -DisplayName "ServiceName" -ServicePrincipalNames "ServiceName/SPNNAME.ekofinance.com" -AccountPassword (ConvertTo-SecureString "SC(b0F(9$mAjgkf^vMmOhl3bw^rQ9x" -AsPlainText -Force) -Enabled $True -GivenName "ServiceName" -PasswordNeverExpires $True


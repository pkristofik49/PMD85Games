# Independent 8080 CPU diagnostics

Historical test binaries mirrored from `superzazu/8080` at
`274ffd700b81baabea99b0963bc1260b67132185`, `cpu_tests/`. Upstream identifies
the original distribution as http://altairclone.com/downloads/cpu_tests/.
Original authorship/copyright notices remain in the binaries and output.
No external CPU library is included in this application.

| File | SHA-256 | Expected cycles |
| --- | --- | ---: |
| 8080PRE.COM | `18eb3c79cba42c0718f160be6a1853cb64cdce7aa47d65780189a57bdd98c4e0` | 7817 |
| TST8080.COM | `9561c6fb6c99efe3de00eb77e4044fd102151058b39ac2d7bce10483838a08e7` | 4924 |
| CPUTEST.COM | `e61a9a75348c774486c2207080ea4effbf6c2367fdace31b0731081a4144030b` | 255653383 |
| 8080EXM.COM | `6e3286e11bb1a8f47b8ee1280b4a067be813193363e3223c99b0d21912f44aeb` | 23803381171 |

The harness matches the independently published test environment: `OUT 0`
at address 0 terminates execution; `OUT 1; RET` at address 5 prints CP/M BDOS
function 2/9 output. This matters for reproducing the exact cycle totals.

import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {PassportModule} from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard, CurrentUser, AuthTokenPayload } from '@project/auth-lib';
import {
  CreateSubscriptionDto,
  UpgradeSubscriptionDto,
  DowngradeSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionOverviewDto,
} from './dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiCreateSubscriptionDocs } from './swagger/subscriptions.create.swagger';
import { ApiUpgradeSubscriptionDocs } from './swagger/subscriptions.upgrade.swagger';

type AuthUser = AuthTokenPayload;

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Get subscriptions for the logged-in user',
    description:
      'Returns all subscriptions associated with the authenticated user. This is a protected endpoint and requires authentication.',
  })
  @Get()
  getSubscriptions(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.getUserSubscriptions(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Create a subscription and initiate the payment process',
    description:
      'For an authenticated user, this endpoint creates a subscription and processes the payment based on the selected plan.',
  })
  @Post()
  @ApiCreateSubscriptionDocs()
  createSubscription(@Body() dto: CreateSubscriptionDto, @CurrentUser() user: AuthUser) {
    return this.subscriptionsService.createSubscription(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Upgrade subscription plan and initiate the payment process',
    description:
      'Allows the authenticated user to upgrade from their current plan to a higher-tier plan. This is a protected endpoint and requires authentication. The upgrade may involve prorated billing or pending payment depending on the new plan.',
  })
  @Post(':id/upgrade')
  @ApiUpgradeSubscriptionDocs()
  upgradeSubscription(
    @Param('id') id: string,
    @Body() dto: UpgradeSubscriptionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subscriptionsService.upgradeSubscription(user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Downgrade subscription plan and initiate the payment process',
    description:
      'Allows an authenticated user to downgrade their subscription plan and initiates the corresponding payment process based on the selected downgrade.',
  })
  @Post(':id/downgrade')
  downgradeSubscription(
    @Param('id') id: string,
    @Body() dto: DowngradeSubscriptionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subscriptionsService.downgradeSubscription(user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Cancel subscription and return to free plan',
    description: 'Allows an authenticated user to cancel their active subscription.',
  })
  @Post(':id/cancel')
  cancelSubscription(
    @Param('id') id: string,
    @Body() dto: CancelSubscriptionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subscriptionsService.cancelSubscription(user.userId, id, dto);
  }

  @Get('/overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({
    summary: 'Get current subscription overview',
    description:
      'Returns the authenticated user’s current plan details and man-hours information, including remaining man-hours.',
  })
  getMySubscriptionOverview(@CurrentUser() user: AuthUser): Promise<SubscriptionOverviewDto> {
    return this.subscriptionsService.getSubscriptionOverview(user.userId);
  }
}

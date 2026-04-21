import { NextRequest, NextResponse } from 'next/server';
import { shiprocketService } from '@/lib/shiprocket';

export async function POST(request: NextRequest) {
  try {
    const { shipmentId } = await request.json();

    if (!shipmentId) {
      return NextResponse.json({
        success: false,
        error: 'Shipment ID is required'
      }, { status: 400 });
    }

    // Get label from Shiprocket
    const label = await shiprocketService.getLabel(shipmentId);

    return NextResponse.json({
      success: true,
      label: {
        label_url: label.label_url,
        awb_number: label.awb_number,
        order_id: label.order_id,
        shipment_id: label.shipment_id
      }
    });

  } catch (error) {
    console.error('Label generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate label'
    }, { status: 500 });
  }
}
